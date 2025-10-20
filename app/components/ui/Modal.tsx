'use client'

import { ReactNode } from 'react'

interface ModalProps {
  id: string
  children: ReactNode
  onClose?: () => void
}

export default function Modal({ id, children, onClose }: ModalProps) {
  return (
    <div id={id} className="modal">
      <div className="modal-content">
        <span className="close-button" onClick={onClose}>
          &times;
        </span>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
