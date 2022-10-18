const proxy = "https://web-production-842b.up.railway.app/";//https://thecrsman.onrender.com/";//"https://anywhrcrs.azurewebsites.net/";

export function toReadable(size) {
    let cnt = 0;
    while (size / 1024 > 1) {
        size /= 1024;
        cnt++;
    }
    const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
    return `${Math.round(size * 100) / 100} ${sizes[cnt]}`;
}

function downloadFile(file) {
    const link = document.createElement('a')
    const url = URL.createObjectURL(file)

    link.href = url
    link.download = file.name
    document.body.appendChild(link)
    link.click()

    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
}

async function downloadChunk(url, urlIndex, status, size, received, promiseIndex, blobs) {
    let res = await fetch(proxy + url, {
        headers: {
            "X-Requested-With": "XMLHttpRequest"
        }
    });
    while (!res.ok) {
        console.log("failed to fetch retrying in 3 seconds")
        await new Promise(r => setTimeout(r, 3000));
        res = await fetch(proxy + urls[index], {
            headers: {
                "X-Requested-With": "XMLHttpRequest"
            }
        });
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

export async function downloadWithStatus(filename, urls, size, status) {
    let blobs = [];
    let received = { size: 0 }; // received that many bytes at the moment

    let promises = [];
    let pushCnt = 0;
    let prevSize = 0;
    let interval = setInterval(() => {
        const diff = (received.size - prevSize) * 4;
        prevSize = received.size;
        status.value.speed = toReadable(diff)+"/s";
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
        downloadFile(file);
    } else {
        status.value = "Failed to download"
    }
}