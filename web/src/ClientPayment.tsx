import { useEffect, useState } from 'react';

const MAX_RECEIPT_BYTES = 2 * 1024 * 1024;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('No se pudo leer la imagen.'));
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.readAsDataURL(file);
  });
}

export default function ClientPayment() {
  const [cedula, setCedula] = useState('');
  const [bank, setBank] = useState('');
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleReceiptChange = (file?: File) => {
    setMessage('');
    if (!file) {
      setReceipt(null);
      setPreviewUrl('');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setMessage('Adjunta una imagen JPG, PNG o WEBP.');
      return;
    }
    if (file.size > MAX_RECEIPT_BYTES) {
      setMessage('La imagen debe pesar 2 MB o menos.');
      return;
    }
    setReceipt(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!receipt) {
      setMessage('Adjunta la imagen del comprobante para enviarlo.');
      return;
    }
    setIsSubmitting(true);
    setMessage('');
    try {
      const response = await fetch('/api/client/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cedula: cedula.trim(),
          banco: bank,
          referencia: reference.trim(),
          monto: Number(amount),
          telefono: phone.trim(),
          comprobanteUrl: await readAsDataUrl(receipt)
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo registrar el comprobante.');
      setSubmitted(true);
      setMessage('Comprobante recibido. El pago queda pendiente de verificación por Cable Tartak.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo enviar el comprobante.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-xl">
        <a href="/" className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">Cable Tartak</a>
        <header className="mb-7 mt-8">
          <h1 className="text-3xl font-black tracking-tight">Reportar Pago Móvil</h1>
          <p className="mt-2 text-sm text-slate-400">El pago se acredita después de verificarlo con el banco.</p>
        </header>

        {submitted ? (
          <section role="status" className="border-l-4 border-emerald-400 bg-slate-900 p-5">
            <h2 className="font-bold text-emerald-300">Comprobante enviado</h2>
            <p className="mt-2 text-sm text-slate-300">{message}</p>
            <a href="/" className="mt-5 inline-block text-sm font-semibold text-cyan-300 hover:text-cyan-200">Volver</a>
          </section>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 border-t border-slate-800 pt-6">
            <label className="block text-sm font-semibold">
              Cédula del titular
              <input value={cedula} onChange={event => setCedula(event.target.value)} required maxLength={20} autoComplete="off" className="mt-1.5 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-normal text-white outline-none focus:border-cyan-400" placeholder="V-12345678" />
            </label>

            <label className="block text-sm font-semibold">
              Banco emisor
              <select value={bank} onChange={event => setBank(event.target.value)} required className="mt-1.5 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400">
                <option value="" disabled>Selecciona el banco</option>
                <option>Banesco</option>
                <option>Banco de Venezuela</option>
                <option>Mercantil</option>
                <option>Provincial</option>
                <option>Bancaribe</option>
                <option>Otro</option>
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold">
                Número de referencia
                <input value={reference} onChange={event => setReference(event.target.value)} required minLength={4} maxLength={32} pattern="[A-Za-z0-9]{4,32}" className="mt-1.5 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-normal text-white outline-none focus:border-cyan-400" />
              </label>
              <label className="block text-sm font-semibold">
                Monto (USD)
                <input type="number" value={amount} onChange={event => setAmount(event.target.value)} required min="0.01" step="0.01" className="mt-1.5 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-normal text-white outline-none focus:border-cyan-400" />
              </label>
            </div>

            <label className="block text-sm font-semibold">
              Teléfono de origen
              <input type="tel" value={phone} onChange={event => setPhone(event.target.value)} maxLength={24} className="mt-1.5 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-normal text-white outline-none focus:border-cyan-400" placeholder="Opcional" />
            </label>

            <label className="block text-sm font-semibold">
              Comprobante (JPG, PNG o WEBP; máximo 2 MB)
              <input type="file" accept="image/jpeg,image/png,image/webp" required onChange={event => handleReceiptChange(event.target.files?.[0])} className="mt-1.5 block w-full text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-700" />
            </label>

            {previewUrl && <img src={previewUrl} alt="Vista previa del comprobante" className="max-h-64 w-full rounded-md border border-slate-800 object-contain" />}
            {message && <p role="alert" className="text-sm text-amber-300">{message}</p>}

            <button type="submit" disabled={isSubmitting} className="w-full rounded-md bg-cyan-600 px-4 py-3 text-sm font-bold text-white hover:bg-cyan-500 disabled:opacity-60">
              {isSubmitting ? 'Enviando...' : 'Enviar comprobante'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}