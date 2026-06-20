import { toast, Slide } from 'react-toastify'

const BASE = {
  position:        'bottom-right',
  autoClose:       3000,
  hideProgressBar: false,
  closeOnClick:    true,
  pauseOnHover:    true,
  draggable:       false,
  transition:      Slide,
}

export const toastSuccess = (msg) => toast.success(msg, BASE)
export const toastError   = (msg) => toast.error(msg, BASE)
export const toastInfo    = (msg) => toast.info(msg, BASE)
