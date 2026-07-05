import { ServiceFormDialog } from './service-form-dialog'
import { useServiceDialogs } from './service-provider'

export function ServiceDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useServiceDialogs()

  return (
    <>
      <ServiceFormDialog
        key='service-create'
        open={open === 'create'}
        onOpenChange={() => setOpen('create')}
      />

      {currentRow && (
        <ServiceFormDialog
          key={`service-edit-${currentRow.id}`}
          open={open === 'edit'}
          onOpenChange={() => {
            setOpen('edit')
            setTimeout(() => setCurrentRow(null), 500)
          }}
          currentRow={currentRow}
        />
      )}
    </>
  )
}
