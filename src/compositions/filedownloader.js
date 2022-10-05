const proxy = "https://anywhrcrs.azurewebsites.net/";

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

export async function download(filename, urls) {
    let blobs = [];
    for (let i = 0; i < urls.length; i++) {
        const res = await fetch(proxy + formatUrl(urls[i]), {
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