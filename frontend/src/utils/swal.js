import Swal from 'sweetalert2';

const theme = () => {
  const dark = document.documentElement.classList.contains('dark');
  return {
    background: dark ? '#111827' : '#ffffff',
    color:      dark ? '#f9fafb' : '#111827',
  };
};

const Toast = Swal.mixin({
  toast: true,
  position: 'top-right',
  showConfirmButton: false,
  timer: 3200,
  timerProgressBar: true,
});

export const notify = {
  success: (title) => Toast.fire({ icon: 'success', title, ...theme() }),
  error:   (title) => Toast.fire({ icon: 'error',   title, ...theme() }),
  warning: (title) => Toast.fire({ icon: 'warning', title, ...theme() }),
  info:    (title) => Toast.fire({ icon: 'info',    title, ...theme() }),
};

export async function confirmAction({ title, text, confirmText = 'Confirmar', danger = false }) {
  const result = await Swal.fire({
    title,
    text,
    icon: danger ? 'warning' : 'question',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
    confirmButtonColor: danger ? '#ef4444' : '#10b981',
    cancelButtonColor:  '#6b7280',
    focusCancel: true,
    ...theme(),
  });
  return result.isConfirmed;
}
