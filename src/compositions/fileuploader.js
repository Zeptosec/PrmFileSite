import { supabase } from '../supabase';
import { ref } from 'vue';
import axios from 'axios'

export const chunkSize = 8 * 1024 * 1024;

/**
 * 
 * @param {File} chunk uploads a single chunk to server.
 * @param {string} url api end point to upload to.
 * @param {Object} status ref to status for storing information about upload
 * @param {Number} index where in array to store this blob for reconstruction purposes
 */
const uploadChunkWithStatus = async (chunk, url, status, index) => {
    if (chunk.size > chunkSize)
        throw Error("Chunk size is too big");

    var data = new FormData();
    data.append('file', chunk);
    let prevLoaded = 0;
    let res = null;
    try {
        res = await axios.post(url, data, {
            onUploadProgress: function (event) {
                // for small files on fast internet otherwise overshoots
                let loaded = Math.min(event.loaded, chunk.size);
                status.value.uploadedBytes += loaded - prevLoaded;
                prevLoaded = loaded;
            }
        });
    } catch (err) {
        throw Error(err.response.data.error)
    }
    if (res == null)
        throw Error("Failed to get a response");
    const json = res.data;
    status.value.location[index] = json.location;
}

/**
 * 
 * @param {File} file File that will be split into largest chunks and uploaded.
 * @param {string} url api end point to upload to.
 * @param {Object} status ref to status for storing information about upload
 */
const uploadChunkedWithStatus = async (file, url, status) => {
    let cnt = 1;
    let start = 0;
    let end = 0;
    let promises = [];
    while (end < file.size) {
        end = Math.min(chunkSize * cnt, file.size)
        const chunk = file.slice(start, end);
        promises.push(uploadChunkWithStatus(chunk, url, status, cnt - 1));
        start = end;
        cnt++;
    }
    await Promise.all(promises);
}

/**
 * 
 * @param {File} file 
 * @param {string} url api end point for uploading files
 * @param {Object} status a ref to object which can be used for showing progress bar
 */
const uploadFileWithStatus = async (file, url, isLoggedIn, status) => {
    if (!file) return;

    status.value = {
        name: file.name,
        size: file.size,
        uploadedBytes: 0,
        location: [],
        finished: false,
    }

    if (file.size > chunkSize) {
        if (!isLoggedIn) {
            throw Error("File is too large. To upload file larger than 8 MB please login.");
        }
        await uploadChunkedWithStatus(file, url, status);
    } else {
        await uploadChunkWithStatus(file, url, status, 0);
    }
    status.value.finished = true;
}

/**
 * 
 * @param {File[]} files files to upload 
 * @param {string} url api end point for uploading files
 * @param {Object[]} status a ref to object which can be used for showing progress bar for each file
 */
export const uploadFilesWithStatus = async (files, url, isLoggedIn, status) => {
    if (files == null) return;
    // when im not lazy would be a good idea to add typescript
    status.value.finished = false;
    await Promise.all(
        files.map(async file => {
            const fstatus = ref();
            status.value.files.push(fstatus);
            try {
                await uploadFileWithStatus(file.file, url, isLoggedIn, fstatus)
            } catch (err) {
                fstatus.value.error = err.message;
                status.value.hasErrors = true;
            }
        })
    )
    status.value.finished = true;
}