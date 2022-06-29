import React from 'react';

import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function RichEditor(props) {
    const {value, onChange, style} = props
    return (
        <ReactQuill theme="snow" value={value} onChange={onChange} style={style}/>
    );
}