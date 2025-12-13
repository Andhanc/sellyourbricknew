import { useState, useRef } from 'react'
import { FiX, FiUpload, FiFile, FiDownload, FiCheckCircle } from 'react-icons/fi'
import Confetti from './Confetti'
import './FileUploadModal.css'

const FileUploadModal = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const fileInputRef = useRef(null)

  if (!isOpen) return null

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]
      const validExtensions = ['.csv', '.xls', '.xlsx']
      const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase()
      
      if (validTypes.includes(selectedFile.type) || validExtensions.includes(fileExtension)) {
        setFile(selectedFile)
      } else {
        alert('Пожалуйста, выберите файл CSV или Excel (.csv, .xls, .xlsx)')
      }
    }
  }

  const handleUpload = async () => {
    if (!file) {
      alert('Пожалуйста, выберите файл для загрузки')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setShowSuccess(false)
    setShowConfetti(false)

    // Имитация загрузки файла (более медленная)
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)
          setShowSuccess(true)
          setShowConfetti(true)
          
          // Скрываем конфетти через 10 секунд (было 3)
          setTimeout(() => {
            setShowConfetti(false)
          }, 10000)

          // Вызываем callback успешной загрузки
          if (onSuccess) {
            setTimeout(() => {
              onSuccess()
              handleClose()
            }, 5000)
          }
          return 100
        }
        // Уменьшаем шаг и увеличиваем интервал для более медленной загрузки
        return prev + 2
      })
    }, 150)
  }

  const handleClose = () => {
    setFile(null)
    setIsUploading(false)
    setUploadProgress(0)
    setShowSuccess(false)
    setShowConfetti(false)
    onClose()
  }

  const handleExampleDownload = () => {
    // Создаем пример CSV файла
    const csvContent = `Название,Локация,Цена,Спальни,Ванные,Площадь (м²),Описание
Lakeshore Blvd West,Costa Adeje, Tenerife,797500,2,2,2000,Роскошная недвижимость с панорамными видами
Eleanor Pena Property,Playa de las Américas, Tenerife,1200000,3,2,1800,Современная вилла в элитном районе
Bessie Cooper Property,Los Cristianos, Tenerife,950000,2,1,1500,Уютный дом рядом с пляжем`

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'example_properties.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      {showConfetti && <Confetti />}
      <div className="file-upload-modal-overlay" onClick={!isUploading ? handleClose : undefined}>
        <div className="file-upload-modal" onClick={(e) => e.stopPropagation()}>
          <button 
            className="file-upload-modal__close" 
            onClick={handleClose}
            disabled={isUploading}
            aria-label="Закрыть"
          >
            <FiX size={24} />
          </button>

          {!showSuccess ? (
            <div className="file-upload-modal__content">
              <div className="file-upload-modal__header">
                <div className="file-upload-modal__icon">
                  <FiUpload size={48} />
                </div>
                <h2 className="file-upload-modal__title">Загрузка файла</h2>
                <p className="file-upload-modal__subtitle">
                  Загрузите файл CSV или Excel с данными о недвижимости
                </p>
              </div>

              <div className="file-upload-area" onClick={() => fileInputRef.current?.click()}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  disabled={isUploading}
                />
                {file ? (
                  <div className="file-upload-area__file">
                    <FiFile size={32} />
                    <div className="file-upload-area__file-info">
                      <p className="file-upload-area__file-name">{file.name}</p>
                      <p className="file-upload-area__file-size">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <button
                      className="file-upload-area__remove"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFile(null)
                      }}
                      disabled={isUploading}
                    >
                      <FiX size={20} />
                    </button>
                  </div>
                ) : (
                  <div className="file-upload-area__empty">
                    <FiUpload size={48} />
                    <p className="file-upload-area__text">
                      Нажмите или перетащите файл сюда
                    </p>
                    <p className="file-upload-area__hint">
                      Поддерживаются форматы: CSV, XLS, XLSX
                    </p>
                  </div>
                )}
              </div>

              <button
                className="file-upload-modal__example-btn"
                onClick={handleExampleDownload}
                disabled={isUploading}
              >
                <FiDownload size={18} />
                <span>Смотреть пример файла</span>
              </button>

              {isUploading && (
                <div className="file-upload-modal__progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-bar__fill"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="progress-text">{uploadProgress}%</p>
                </div>
              )}

              <div className="file-upload-modal__actions">
                <button
                  className="file-upload-modal__cancel-btn"
                  onClick={handleClose}
                  disabled={isUploading}
                >
                  Отмена
                </button>
                <button
                  className="file-upload-modal__upload-btn"
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                >
                  {isUploading ? 'Загрузка...' : 'Загрузить'}
                </button>
              </div>
            </div>
          ) : (
            <div className="file-upload-modal__success">
              <div className="success-icon">
                <FiCheckCircle size={64} />
              </div>
              <h2 className="success-title">Объекты успешно загружены!</h2>
              <p className="success-text">
                Все объекты из файла были добавлены в вашу базу данных
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default FileUploadModal
