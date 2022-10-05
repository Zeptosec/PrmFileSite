import { supabase } from '../supabase';

export const chunkSize = 8 * 1024 * 1024;

async function uploadChunked(file, url) {
    const locs = [];

    let cnt = 1;
    let start = 0;
    let end = 0;
    while (end < file.size) {
        end = Math.min(chunkSize * cnt, file.size)
        const chunk = file.slice(start, end);
        const dataForm = new FormData();
        dataForm.append('file', chunk);
        console.log("uploading " + cnt + " chunk");
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            body: dataForm
        });
        const json = await res.json();
        locs.push(json.location);
        start = end;
        cnt++;
    }
    return locs;
}

export const uploadFile = async (file, url) => {
    if (file == null) return;
    // await downloadChunked("spraygen-134.zip",
    //     ['https://cdn.discordapp.com/attachments/1025526944776867952/1026897371382173806/blob',
    //         'https://cdn.discordapp.com/attachments/1025526944776867952/1026897389430251530/blob']);
    if (file.size > chunkSize) {
        const user = supabase.auth.user();
        if(!user){
            throw Error("File is too large. To upload file larger than 8 MB please login.");
        }
        const locs = await uploadChunked(file, url);
        return { name: file.name, location: locs, size: file.size };
    }
    var data = new FormData();
    data.append('file', file);
    console.log("trying to upload")
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            "Access-Control-Allow-Origin": "*"
        },
        body: data
    })
    console.log("uploaded");
    const json = await res.json();
    if (res.ok) {
        return { name: file.name, location: json.location, size: file.size };
    } else {
        throw Error(json.error);
    }
}

export const uploadFiles = async (files, url, errMsg = null) => {
    if (files == null) return;
    let locs = [];
    let cnt = 0;
    await Promise.all(
        files.map(
            async file => {
                locs.push(await uploadFile(file.file, url));
                if (errMsg != null) {
                    cnt++;
                    errMsg.value = `Files uploaded ${cnt}/${files.length}`;
                }
            }
        )
    );
    return locs;
}
