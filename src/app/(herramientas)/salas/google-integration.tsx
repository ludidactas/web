import React, { useState, useEffect } from 'react';

// DECLARACIÓN DE TIPOS PARA EL SDK DE GOOGLE
declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

interface DrivePickerEmbedProps {
  clientId: string;
  apiKey: string;
}

export const DrivePickerEmbed: React.FC<DrivePickerEmbedProps> = ({ clientId, apiKey }) => {
  const [selectedFile, setSelectedFile] = useState<{ id: string; mimeType: string } | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [tokenClient, setTokenClient] = useState<any>(null);

  // 1. Cargar dinámicamente los SDKs de Google
  useEffect(() => {
    const loadScripts = () => {
      const scriptGsi = document.createElement('script');
      scriptGsi.src = 'https://accounts.google.com/gsi/client';
      scriptGsi.async = true;
      document.body.appendChild(scriptGsi);

      const scriptGapi = document.createElement('script');
      scriptGapi.src = 'https://apis.google.com/js/api.js';
      scriptGapi.async = true;
      scriptGapi.onload = () => {
        window.gapi.load('picker', () => setIsLoaded(true));
      };
      document.body.appendChild(scriptGapi);
    };

    loadScripts();
  }, []);

  // 2. Inicializar cliente OAuth
  useEffect(() => {
    if (isLoaded && window.google) {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (response: any) => {
          if (response.access_token) {
            openPicker(response.access_token);
          }
        },
      });
      setTokenClient(client);
    }
  }, [isLoaded, clientId]);

  // 3. Abrir el Picker de Google
  const handleSelectFile = () => {
    if (tokenClient) {
      tokenClient.requestAccessToken({ prompt: '' });
    }
  };

  const openPicker = (accessToken: string) => {
    const view = new window.google.picker.View(window.google.picker.ViewId.DOCS);
    const picker = new window.google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(accessToken)
      .setDeveloperKey(apiKey)
      .setCallback((data: any) => {
        if (data.action === window.google.picker.Action.PICKED) {
          const doc = data.docs[0];
          // Guardamos el ID del archivo personal del usuario
          setSelectedFile({ id: doc.id, mimeType: doc.mimeType });
        }
      })
      .build();

    picker.setVisible(true);
  };

  // 4. Determinar la URL para el iframe según el archivo elegido
  const getEmbedUrl = () => {
    if (!selectedFile) return '';
    if (selectedFile.mimeType === 'application/vnd.google-apps.spreadsheet') {
      return `https://docs.google.com/spreadsheets/d/${selectedFile.id}/edit`;
    }
    if (selectedFile.mimeType === 'application/vnd.google-apps.document') {
      return `https://docs.google.com/document/d/${selectedFile.id}/edit`;
    }
    return `https://drive.google.com/file/d/${selectedFile.id}/preview`;
  };

  return (
    <div style={{ width: '100%', padding: '1rem' }}>
      <button 
        onClick={handleSelectFile}
        disabled={!isLoaded}
        style={{ padding: '10px 16px', marginBottom: '1rem', cursor: 'pointer' }}
      >
        Seleccionar archivo de mi Drive
      </button>

      {selectedFile && (
        <iframe
          src={getEmbedUrl()}
          width="100%"
          height="700px"
          style={{ border: '1px solid #ccc' }}
          allow="autoplay"
        />
      )}
    </div>
  );
};