"use client"

import { useState } from "react";
import FileList from "@/components/file-list";
import { File as FileType } from "@prisma/client";

const PartFiles = ({ files }: { files: FileType[] }) => {
    const [fileList, setFileList] = useState<any[]>(files);

    const handleFileChange = (value) => {
        setFileList(value);
        console.log("changed", value);
    }

    return (
        <FileList files={fileList} onChange={(value) => handleFileChange(value)} />
    )
}

export default PartFiles;
