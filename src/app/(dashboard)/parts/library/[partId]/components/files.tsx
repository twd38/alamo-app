'use client';

import { useState, useEffect } from 'react';
import { FileList } from '@/components/files/file-list';
import { File as FileType } from '@prisma/client';

type PartFilesProps = {
  files: FileType[];
  onChange: (files: File[]) => void | Promise<void>;
};

const PartFiles = (props: PartFilesProps) => {
  const { files, onChange } = props;
  const [fileList, setFileList] = useState<any[]>(files);

  // TODO: fix type error
  const handleUpload = async (value: any) => {
    const newFileList = [...fileList, ...value];
    setFileList(newFileList);
    await onChange(newFileList);
  };

  const handleDelete = async (file: FileType) => {
    const newFileList = fileList.filter((f) => f.id !== file.id);
    setFileList(newFileList);
    await onChange(newFileList);
  };

  return (
    <FileList
      files={files}
      uploadPath="parts"
      onUpload={handleUpload}
      onDelete={handleDelete}
    />
  );
};

export default PartFiles;
