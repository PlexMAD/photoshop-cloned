import React, { FC } from 'react';

interface MyFileInputProps {
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void,
    accept: string
}

const MyFileInput: FC<MyFileInputProps> = ({onChange, accept}) => {
    return (
        <div className='upload-input'>
            <input type='file' accept={accept} onChange={onChange} className='upload-input__fileinput'/>
            <button className='upload-input__button'>Загрузить файл</button>
        </div>
    );
};

export default MyFileInput;