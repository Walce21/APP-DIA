// js/userProfile.js

import * as dom from './domElements.js';
// --- INÍCIO DA ALTERAÇÃO ---
import * as modalManager from './modalManager.js';
// --- FIM DA ALTERAÇÃO ---

let lastSavedSettings = {};

function getBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

async function handleLogoUpload(event, previewElementId, storageKey) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // Limite de 2MB
        log('userProfile', 'warn', `Upload de logo cancelado: arquivo muito grande (${file.size} bytes).`);
        // --- INÍCIO DA REATORAÇÃO: Substituindo alert() por modal customizado ---
        modalManager.showGeneralModal("O arquivo de imagem é muito grande. Por favor, escolha um arquivo menor que 2MB.");
        // --- FIM DA REATORAÇÃO ---
        return;
    }

    log('userProfile', 'info', `Processando upload de logo para: ${storageKey}`);
    try {
        const base64String = await getBase64(file);
        const previewElement = document.getElementById(previewElementId);
        previewElement.innerHTML = `<img src="${base64String}" alt="Pré-visualização do Logo">`;
        
        const currentSettings = JSON.parse(localStorage.getItem('reportSettings')) || {};
        currentSettings[storageKey] = base64String;
        localStorage.setItem('reportSettings', JSON.stringify(currentSettings));

        lastSavedSettings[storageKey] = base64String;
        log('userProfile', 'info', `Logo ${storageKey} atualizado e salvo no cache local.`);

    } catch (error) {
        log('userProfile', 'error', "Erro ao processar o upload do logo:", error);
        // --- INÍCIO DA REATORAÇÃO: Substituindo alert() por modal customizado ---
        modalManager.showGeneralModal("Ocorreu um erro ao carregar a imagem.");
        // --- FIM DA REATORAÇÃO ---
    }
}

function loadProfile() {
    try {
        const savedSettings = JSON.parse(localStorage.getItem('reportSettings'));
        if (savedSettings) {
            log('userProfile', 'info', "Carregando perfil de usuário do localStorage.");
            dom.analystNameInput.value = savedSettings.analystName || '';
            dom.operatorRoleInput.value = savedSettings.operatorRole || '';
            dom.labNameInput.value = savedSettings.labName || '';
            dom.institutionNameInput.value = savedSettings.institutionName || '';
            dom.contactEmailInput.value = savedSettings.contactEmail || '';
            dom.contactPhoneInput.value = savedSettings.contactPhone || '';

            if (savedSettings.labLogo) {
                dom.labLogoPreview.innerHTML = `<img src="${savedSettings.labLogo}" alt="Pré-visualização do Logo do Laboratório">`;
            } else {
                dom.labLogoPreview.innerHTML = `<span>Pré-visualização</span>`;
            }
            if (savedSettings.institutionLogo) {
                dom.institutionLogoPreview.innerHTML = `<img src="${savedSettings.institutionLogo}" alt="Pré-visualização do Logo da Instituição">`;
            } else {
                dom.institutionLogoPreview.innerHTML = `<span>Pré-visualização</span>`;
            }
            lastSavedSettings = savedSettings;
        } else {
            log('userProfile', 'info', "Nenhum perfil de usuário encontrado no localStorage.");
        }
    } catch (e) {
        log('userProfile', 'error', "Erro ao carregar perfil do localStorage:", e);
        lastSavedSettings = {};
    }
}

function saveSettings() {
    log('userProfile', 'info', "Salvando configurações do perfil e fechando o modal.");
    const settings = {
        analystName: dom.analystNameInput.value,
        operatorRole: dom.operatorRoleInput.value,
        labName: dom.labNameInput.value,
        institutionName: dom.institutionNameInput.value,
        contactEmail: dom.contactEmailInput.value,
        contactPhone: dom.contactPhoneInput.value,
        labLogo: lastSavedSettings.labLogo || null,
        institutionLogo: lastSavedSettings.institutionLogo || null,
    };
    localStorage.setItem('reportSettings', JSON.stringify(settings));
    lastSavedSettings = settings;
    closeSettingsModal(true);
}

export function openSettingsModal() {
    log('userProfile', 'info', "Abrindo modal de configurações do perfil.");
    loadProfile(); 
    if(dom.settingsModal) dom.settingsModal.dataset.visible = 'true'; // REATORADO
}

export function closeSettingsModal(wasSaved = false) {
    if(dom.settingsModal) {
        dom.settingsModal.dataset.visible = 'false'; // REATORADO
        if (!wasSaved) {
            log('userProfile', 'info', "Modal de configurações fechado sem salvar. Revertendo alterações não salvas.");
            // A lógica de reverter para o estado anterior permanece a mesma
            if (lastSavedSettings.labLogo) {
                dom.labLogoPreview.innerHTML = `<img src="${lastSavedSettings.labLogo}" alt="Pré-visualização do Logo do Laboratório">`;
            } else {
                dom.labLogoPreview.innerHTML = `<span>Pré-visualização</span>`;
            }
            if (lastSavedSettings.institutionLogo) {
                dom.institutionLogoPreview.innerHTML = `<img src="${lastSavedSettings.institutionLogo}" alt="Pré-visualização do Logo da Instituição">`;
            } else {
                dom.institutionLogoPreview.innerHTML = `<span>Pré-visualização</span>`;
            }
        }
    }
}

export function initializeUserProfile() {
    if (dom.settingsButton) {
        dom.settingsButton.addEventListener('click', openSettingsModal);
    }

    if(dom.saveSettingsButton) dom.saveSettingsButton.addEventListener('click', saveSettings);
    if(dom.cancelSettingsButton) dom.cancelSettingsButton.addEventListener('click', () => closeSettingsModal(false));
    if(dom.closeSettingsModalButton) dom.closeSettingsModalButton.addEventListener('click', () => closeSettingsModal(false));
    if(dom.labLogoUpload) dom.labLogoUpload.addEventListener('change', (e) => handleLogoUpload(e, 'labLogoPreview', 'labLogo'));
    if(dom.institutionLogoUpload) dom.institutionLogoUpload.addEventListener('change', (e) => handleLogoUpload(e, 'institutionLogoPreview', 'institutionLogo'));
    
    loadProfile();
}