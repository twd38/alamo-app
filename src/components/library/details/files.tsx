"use client"

import { useState, useEffect } from "react";
import FileList from "@/components/file-list";
import { File as FileType } from "@prisma/client";

type PartFilesProps = {
    files: FileType[];
    onChange: (files: File[]) => void;
}

const PartFiles = (props: PartFilesProps) => {
    const { files, onChange } = props;
    const [fileList, setFileList] = useState<any[]>(files);

    // TODO: fix type error
    const handleFileChange = (value: any) => {
        setFileList(value);
        onChange(value);
    }


    return (
        <FileList files={fileList} onChange={(value) => handleFileChange(value)} />
    )
}

export default PartFiles;
