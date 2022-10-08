const proxy = "https://crsfr.onrender.com/";//"https://anywhrcrs.azurewebsites.net/";

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

export async function downloadWithStatus(filename, urls, size, status) {
    let blobs = [];
    let receivedLength = 0; // received that many bytes at the moment

    await Promise.all(urls.map(async (w, index) => {
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

        let chunks = [];

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
        blobs[index] = blob;

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