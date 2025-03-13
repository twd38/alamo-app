"use client"

import { useState } from "react";
import FileList from "@/components/file-list";
import { File as FileType } from "@prisma/client";

const PartFiles = ({ files }: { files: FileType[] }) => {
    const [fileList, setFileList] = useState<any[]>(files);

    // TODO: fix type error
    const handleFileChange = (value: any) => {
        setFileList(value);
        console.log("changed", value);
    }

    return (
        <FileList files={fileList} onChange={(value) => handleFileChange(value)} />
    )
}

export default PartFiles;
