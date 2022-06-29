import React, {useEffect, useState} from 'react';
import RichEditor from "../../../components/RichEditor";
import {Button, message, Space} from "antd";
import axios from "../../../utils/axios";

function ArticleEditAndView() {
  const [originalContent, setOriginalContent] = useState('')
  const [contentId, setContentId] = useState(null)
  const [editing, setEditing] = useState(false)
  const [content, setContent] = useState('')
  const handleCancel = () => {
    setEditing(false)
  }

  const handleSave = () => {
    axios.post('/bi-metadata/api/admin/biMtdTblNamingRules/saveOrUpdate', {
      content: content,
      id: contentId
    }).then(() => {
      message.success('更新成功')
      setOriginalContent(content)
      setEditing(false)
    })
  }

  const handleEdit = () => {
    setEditing(true)
    setContent(originalContent)
  }

  useEffect(() => {
    const fetch = () => {
      axios.get('/bi-metadata/api/admin/biMtdTblNamingRules/list').then(({data}) => {
        const content = data?.list?.[0]?.content
        const id = data?.list?.[0]?.id
        setOriginalContent(content)
        setContentId(id)
      })
    }
    if (!editing) {
      fetch()
    }
  }, [editing])

  return (
    <>
      <div className={'flex justify-end mb-2.5'}>
        <Space>
          {
            editing ? <>
                <Button onClick={handleCancel}>取消</Button>
                <Button type={"primary"} onClick={handleSave}>保存</Button>
              </>
              : <Button onClick={handleEdit}>编辑</Button>
          }
        </Space>
      </div>
      {
        editing ?
          <RichEditor value={content} onChange={(v) => setContent(v)}
                      style={{height: 'calc(100vh - 280px)'}}/>
          : <div className={'ql-editor'} style={{overflow: 'auto', maxHeight: 'calc(100% - 40px)'}}>
            <div dangerouslySetInnerHTML={{__html: originalContent}}/>
          </div>
      }
    </>
  );
}

export default ArticleEditAndView;