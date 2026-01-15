import AccessDenied from '@/components/ui/AccessDenied';

export default function AccesoDenegadoPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Ya no pasamos volverUrl porque el botón ahora usa router.back() automáticamente */}
      <AccessDenied 
        mensaje="No tienes los permisos necesarios para ver esta sección." 
      />
    </div>
  );
}