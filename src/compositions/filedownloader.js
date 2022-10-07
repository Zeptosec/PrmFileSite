const proxy = "https://crsfr.onrender.com/";//"https://anywhrcrs.azurewebsites.net/";

function formatUrl(url) {
    const ind = url.indexOf('://');
    let nurl = "";
    if (ind != -1) {
        nurl = url.split('://')[1];
    } else {
        nurl = url;
    }
    const portPlace = nurl.indexOf("/");
    if (portPlace == -1)
        return nurl + ":443";
    const part1 = nurl.slice(0, portPlace);
    const part2 = nurl.slice(portPlace);
    return part1 + ":443" + part2;
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

export async function downloadWithStatus(filename, urls, size, status) {
    let blobs = [];
    let receivedLength = 0; // received that many bytes at the moment

    await Promise.all(urls.map(async w => {
        let res;
        res = await fetch(proxy + w, {
            headers: {
                "X-Requested-With": "XMLHttpRequest"
            }
        });
        while (!res.ok) {
            console.log("failed to fetch retrying in 3 seconds")
            await new Promise(r => setTimeout(r, 3000));
            res = await fetch(proxy + urls[i], {
                headers: {
                    "X-Requested-With": "XMLHttpRequest"
                }
            });
        }

        const reader = res.body.getReader();

        let chunks = []; // array of received binary chunks (comprises the body)

        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                break;
            }

            chunks.push(value);
            receivedLength += value.length;

            status.value.msg = `Download progress: ${Math.round(receivedLength / size * 10000) / 100}%`
        }

        const blob = new Blob(chunks);

        blobs.push(blob);
    }));

    if (blobs.length > 0) {
        let file = new File(blobs, filename)
        status.value.finished = true;
        status.value.msg = "Download Complete";
        downloadFile(file);
    } else {
        status.value = "Failed to download"
    }
}

export async function download(filename, urls) {
    let blobs = [];
    for (let i = 0; i < urls.length; i++) {
        const res = await fetch(proxy + urls[i]/*formatUrl(urls[i])*/, {
            headers: {
                "X-Requested-With": "XMLHttpRequest"
            }
        });
        const blob = await res.blob();
        blobs.push(blob);
    }
    let file = new File(blobs, filename)
    downloadFile(file);
}