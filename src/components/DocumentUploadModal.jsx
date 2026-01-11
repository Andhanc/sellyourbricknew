import { useState, useRef } from 'react'
import { FiX, FiUpload, FiFile, FiLoader } from 'react-icons/fi'
import { recognizeTextAndLog } from '../services/ocrService'
import './DocumentUploadModal.css'

const DocumentUploadModal = ({ isOpen, onClose, documentType, documentTitle, onUpload }) => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Проверяем, что файл - это изображение
      if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, выберите изображение')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleRemove = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Пожалуйста, выберите файл')
      return
    }

    setIsUploading(true)
    try {
      // Распознаем текст с изображения перед загрузкой
      console.log('Начало распознавания текста с загружаемого документа...')
      try {
        await recognizeTextAndLog(selectedFile)
      } catch (ocrError) {
        console.warn('Ошибка при распознавании текста (продолжаем загрузку):', ocrError)
      }
      
      await onUpload(selectedFile)
      // После успешной загрузки закрываем модальное окно
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onClose()
    } catch (error) {
      console.error('Ошибка при загрузке документа:', error)
      alert('Ошибка при загрузке документа. Попробуйте снова.')
    } finally {
      setIsUploading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="document-upload-modal-overlay" onClick={onClose}>
      <div className="document-upload-modal" onClick={(e) => e.stopPropagation()}>
        <button className="document-upload-modal__close" onClick={onClose}>
          <FiX size={24} />
        </button>
        
        <div className="document-upload-modal__content">
          <h2 className="document-upload-modal__title">{documentTitle}</h2>
          <p className="document-upload-modal__description">
            Выберите изображение для загрузки
          </p>
          
          {!selectedFile ? (
            <div className="document-upload-modal__upload-area">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="document-upload-modal__file-input"
                id="document-file-input"
                disabled={isUploading}
              />
              <label
                htmlFor="document-file-input"
                className="document-upload-modal__upload-btn"
              >
                <FiUpload size={20} />
                <span>Выбрать файл</span>
              </label>
            </div>
          ) : (
            <div className="document-upload-modal__file-info">
              <div className="document-upload-modal__file-icon">
                <FiFile size={24} />
              </div>
              <div className="document-upload-modal__file-details">
                <p className="document-upload-modal__file-name">{selectedFile.name}</p>
                <p className="document-upload-modal__file-size">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} МБ
                </p>
              </div>
              <button
                className="document-upload-modal__remove-btn"
                onClick={handleRemove}
                disabled={isUploading}
              >
                Удалить
              </button>
            </div>
          )}
          
          <div className="document-upload-modal__actions">
            <button
              className="document-upload-modal__btn document-upload-modal__btn--cancel"
              onClick={onClose}
              disabled={isUploading}
            >
              Отмена
            </button>
            <button
              className="document-upload-modal__btn document-upload-modal__btn--upload"
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? (
                <>
                  <FiLoader className="document-upload-modal__loader" size={20} />
                  <span>Загрузка...</span>
                </>
              ) : (
                'Загрузить'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DocumentUploadModal

