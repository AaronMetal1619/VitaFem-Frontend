import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
// En tu entorno local (VS Code), usa: import { embedDashboard } from "@superset-ui/embedded-sdk";
// Para esta vista previa, usamos esm.sh:
import { embedDashboard } from "https://esm.sh/@superset-ui/embedded-sdk";

const supersetUrl = 'https://superset2-production.up.railway.app';
const supersetApiUrl = supersetUrl + '/api/v1/security';
const dashboardId = "56b6b915-fbf8-464c-a927-a360d1447e2b";

const SupersetDashboard = () => {
    // Usamos useRef para referenciar el div donde se montará el dashboard de forma segura en React
    const dashboardRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTokenAndEmbed = async () => {
            try {
                // 1. Obtener Access Token (Login)
                const login_body = {
                    "password": "admin",
                    "provider": "db",
                    "refresh": true,
                    "username": "admin"
                };

                const login_headers = { headers: { "Content-Type": "application/json" } };

                // console.log("Intentando login...");
                const { data } = await axios.post(supersetApiUrl + '/login', login_body, login_headers);
                const access_token = data['access_token'];

                // 2. Obtener Guest Token
                const guest_token_body = {
                    "resources": [{ "type": "dashboard", "id": dashboardId }],
                    "rls": [],
                    "user": {
                        "username": "report-viewer",
                        "first_name": "Report",
                        "last_name": "Viewer"
                    }
                };

                const guest_token_headers = {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": 'Bearer ' + access_token
                    }
                };

                const guestResponse = await axios.post(supersetApiUrl + '/guest_token/', guest_token_body, guest_token_headers);
                const guestToken = guestResponse.data['token'];

                // 3. Embeber el Dashboard
                // Verificamos que el elemento ref exista antes de embeber
                if (dashboardRef.current) {
                    await embedDashboard({
                        id: dashboardId,
                        supersetDomain: supersetUrl,
                        mountPoint: dashboardRef.current, // Usamos la referencia en lugar de getElementById
                        fetchGuestToken: () => guestToken,
                        dashboardUiConfig: {
                            hideTitle: true,
                            hideChartControls: false,
                            hideTab: true // Oculta pestañas nativas de superset si quieres una vista más limpia
                        }
                    });
                }
                setLoading(false);

            } catch (err) {
                console.error("Error al conectar con Superset:", err);
                setError("No se pudo cargar el dashboard. Verifica la conexión o las credenciales.");
                setLoading(false);
            }
        };

        fetchTokenAndEmbed();
    }, []);

    return (
        <div className="superset-wrapper-full">
            {/* Estilos embebidos para evitar errores de importación de CSS */}
            <style>{`
                .superset-wrapper-full {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden; /* Evita doble scrollbar */
                    background-color: #fff;
                }
                .superset-container-embed {
                    width: 100%;
                    height: 100%;
                    flex-grow: 1;
                }
                /* Forzar que el iframe generado por Superset ocupe el 100% */
                .superset-container-embed iframe {
                    width: 100% !important;
                    height: 100% !important;
                    border: none;
                    display: block;
                }
            `}</style>

            {loading && (
                <div className="d-flex justify-content-center align-items-center h-100">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Cargando métricas...</span>
                    </div>
                    <span className="ms-2 text-muted">Cargando Dashboard Financiero...</span>
                </div>
            )}

            {error && (
                <div className="alert alert-danger m-4" role="alert">
                    {error}
                </div>
            )}

            {/* El contenedor donde Superset inyectará el iframe */}
            <div ref={dashboardRef} className="superset-container-embed" />
        </div>
    );
};

export default SupersetDashboard;