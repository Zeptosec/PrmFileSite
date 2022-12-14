const proxy = "https://frxcr-zeptosec.koyeb.app/";//"https://thecrsman.onrender.com/";//"https://web-production-842b.up.railway.app/";//https://thecrsman.onrender.com/";//"https://anywhrcrs.azurewebsites.net/";
const proxies = ['https://frxcr-zeptosec.koyeb.app/',
'https://thecrsman.onrender.com/'];

export function getIdFromLink(links){
    let rs = links.map(w => w.split('/')[5]);
    return rs;
}

export function getLinkFromFile(file){
    if(file.location.length > 30) return file.location;
    const link = `https://cdn.discordapp.com/attachments/1025526944776867952/${file.location}/${file.name}`;
    return link;
}

export function toReadable(size) {
    let cnt = 0;
    while (size / 1024 > 1) {
        size /= 1024;
        cnt++;
    }
    const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
    return `${Math.round(size * 100) / 100} ${sizes[cnt]}`;
}

function getDownloadUrl(file){
    const url = URL.createObjectURL(file)
    return url;
}

function downloadFile(file) {
    const url = getDownloadUrl(file)
    downloadFileUrl(file.name, url);
}

export function downloadFileUrl(name, url){
    const link = document.createElement('a');

    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
}

async function downloadChunk(url, urlIndex, status, size, received, promiseIndex, blobs) {
    let res = null;
    let gotRes = false;
    let ind = 0;
    while (!gotRes) {
        try {
            const builtURL = getLinkFromFile({ location: url, name: "blob" })
            //console.log(url)
            res = await fetch(proxies[ind] + builtURL, {
                headers: {
                    "X-Requested-With": "XMLHttpRequest"
                }
            });
            gotRes = true;
        } catch (err) {
            ind = (ind + 1) % proxies.length;
            console.log(err);
            gotRes = false;
            console.log("failed to fetch retrying in 3 seconds")
            await new Promise(r => setTimeout(r, 3000));
        }
    }
    const reader = res.body.getReader();

    let chunks = [];

    while (true) {
        const { done, value } = await reader.read();

        if (done) {
            break;
        }

        chunks.push(value);
        received.size += value.length;

        status.value.msg = `Download progress: ${Math.round(received.size / size * 10000) / 100}%`;
        status.value.downloadedBytes = received.size;
    }

    blobs[urlIndex] = new Blob(chunks);
    return promiseIndex;
}

export async function downloadWithStatus(filename, urls, size, status, isDownload = true) {
    let blobs = [];
    let received = { size: 0 }; // received that many bytes at the moment

    let promises = [];
    let pushCnt = 0;
    let prevSize = 0;
    let interval = setInterval(() => {
        const diff = (received.size - prevSize) * 4;
        prevSize = received.size;
        status.value.speed = toReadable(diff) + "/s";
    }, 250);
    for (let c = 0; c < urls.length; c++) {
        let completed = null;
        if (promises.length >= 10) {
            completed = await Promise.any(promises);
        } else {
            promises.push(downloadChunk(urls[c], c, status, size, received, pushCnt, blobs));
            pushCnt++;
        }
        if (completed != null) {
            promises[completed] = downloadChunk(urls[c], c, status, size, received, completed, blobs);
        }
    }
    await Promise.all(promises);
    clearInterval(interval);
    if (blobs.length > 0) {
        let file = new File(blobs, filename)
        status.value.finished = true;
        status.value.msg = "Download Complete";
        status.value.fileurl = getDownloadUrl(file);
        if(isDownload)
            downloadFile(file);
    } else {
        status.value = "Failed to download"
    }
}