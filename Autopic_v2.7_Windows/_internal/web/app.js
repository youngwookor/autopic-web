/**
 * Autopic Desktop v2.5
 * - 웹 API 연동 기능 추가
 * - 로딩바 즉시 반응
 * - 미리보기 모달 방식
 * - 4장 세트 단위 재생성
 */

var state = {
    currentImage: null,
    currentMode: 'product',
    currentGender: '여성',
    generatedImages: [],
    history: [],
    batchFolder: '',
    products: [],
    apiReady: false,
    brands: [],
    categories: {},
    batchGender: 'auto',
    batchProcessing: false,
    currentPreview: null,
    businessType: 'luxury',
    useBrand: true,
    imageModel: 'gemini-3-pro',
    // 웹 API 관련
    webApiKey: '',
    webApiUrl: 'https://autopic-web.vercel.app/backend',
    useWebApi: false,
    webCredits: 0
};

var logPollInterval = null;

// ========== API ==========
function callApi(method) {
    var args = Array.prototype.slice.call(arguments, 1);
    return new Promise(function (resolve, reject) {
        if (!window.pywebview || !window.pywebview.api) { reject(new Error('API not ready')); return; }
        try {
            var result = window.pywebview.api[method].apply(window.pywebview.api, args);
            if (result && typeof result.then === 'function') result.then(resolve).catch(reject);
            else resolve(result);
        } catch (e) { reject(e); }
    });
}

// ========== 초기화 ==========
window.addEventListener('pywebviewready', function () { state.apiReady = true; updateApiStatus(true); init(); });
setTimeout(function () { if (!state.apiReady && window.pywebview && window.pywebview.api) { state.apiReady = true; updateApiStatus(true); init(); } }, 1000);

function init() { setupEventListeners(); loadSettings(); startLogPolling(); }

function updateApiStatus(connected) {
    var el = document.getElementById('apiStatus');
    // 웹 API 연결 상태를 표시
    if (state.useWebApi && state.webApiKey) {
        el.innerHTML = '<span class="w-2 h-2 rounded-full bg-lime-500"></span><span class="text-xs font-medium text-zinc-700">웹 API 연결됨 (' + state.webCredits + ' 크레딧)</span>';
    } else {
        el.innerHTML = '<span class="w-2 h-2 rounded-full bg-red-500"></span><span class="text-xs font-medium text-zinc-500">API 미연결</span>';
    }
}

function setupEventListeners() {
    var dropZone = document.getElementById('dropZone');
    var fileInput = document.getElementById('fileInput');
    if (dropZone) {
        dropZone.onclick = function () { fileInput.click(); };
        dropZone.ondragover = function (e) { e.preventDefault(); dropZone.classList.add('dragover'); };
        dropZone.ondragleave = function () { dropZone.classList.remove('dragover'); };
        dropZone.ondrop = function (e) { e.preventDefault(); dropZone.classList.remove('dragover'); if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]); };
    }
    if (fileInput) fileInput.onchange = function (e) { if (e.target.files.length) handleFile(e.target.files[0]); };
}

function loadSettings() {
    callApi('get_settings').then(function (s) {
        if (!s) return;
        if (s.gemini_api_keys && s.gemini_api_keys.length) document.getElementById('settingsGeminiKey').value = s.gemini_api_keys.join(', ');
        if (s.claude_api_key) document.getElementById('settingsClaudeKey').value = s.claude_api_key;
        if (s.last_folder) { state.batchFolder = s.last_folder; document.getElementById('batchFolderInput').value = s.last_folder; checkBatchState(); refreshProductList(); }
        if (s.brands) { state.brands = s.brands; renderBrandList(); }
        if (s.categories) { state.categories = s.categories; renderCategoryList(); updateCategory1Select(); }
        // 업종 설정 로드
        if (s.business_type) { state.businessType = s.business_type; }
        if (typeof s.use_brand !== 'undefined') { state.useBrand = s.use_brand; }
        // 이미지 모델 설정 로드
        if (s.image_model) { state.imageModel = s.image_model; }
        // 웹 API 설정 로드
        if (s.web_api_key) {
            state.webApiKey = s.web_api_key;
            document.getElementById('webApiKeyInput').value = s.web_api_key;
        }
        if (s.web_api_url) {
            state.webApiUrl = s.web_api_url;
            document.getElementById('webApiUrlInput').value = s.web_api_url;
        }
        if (typeof s.use_web_api !== 'undefined') {
            state.useWebApi = s.use_web_api;
        }
        updateBusinessTypeUI();
        updateImageModelUI();
        updateWebApiStatusUI();
        updateApiStatus(s.has_api);

        // 웹 API 연결되어 있으면 크레딧 확인
        if (s.use_web_api && s.web_api_key) {
            checkWebCredits();
        }
    });
}

function startLogPolling() {
    if (logPollInterval) clearInterval(logPollInterval);
    logPollInterval = setInterval(function () {
        if (!state.apiReady) return;
        callApi('get_logs').then(function (logs) {
            if (!logs || !logs.length) return;
            var container = document.getElementById('logContent');
            logs.forEach(function (log) {
                // 진행률 파싱
                if (log.message.startsWith('PROGRESS:') && state.batchProcessing) {
                    var parts = log.message.split(':');
                    var current = parseInt(parts[1]);
                    var total = parseInt(parts[2]);
                    var percent = Math.round((current / total) * 90 + 10);
                    document.getElementById('batchProgress').style.width = percent + '%';
                    document.getElementById('batchProgressText').textContent = current + '/' + total + ' 처리 중';
                    document.getElementById('batchBtnText').textContent = '⏳ ' + current + '/' + total;
                    return;
                }
                var color = log.level === 'ERROR' ? '#ef4444' : log.level === 'WARNING' ? '#eab308' : '#a3e635';
                var line = document.createElement('div');
                line.innerHTML = '<span style="color:#6b7280">[' + log.time + ']</span> <span style="color:' + color + '">' + log.message + '</span>';
                container.appendChild(line);
            });
            if (document.getElementById('autoScroll').checked) document.getElementById('logContainer').scrollTop = document.getElementById('logContainer').scrollHeight;
        });
    }, 1000);
}

// ========== 탭 ==========
function switchTab(name) {
    document.querySelectorAll('.tab-content').forEach(function (el) { el.classList.add('hidden'); });
    document.getElementById('tab-' + name).classList.remove('hidden');
    document.querySelectorAll('.tab-btn').forEach(function (btn) { btn.classList.remove('active'); btn.classList.add('text-zinc-400'); });
    var active = document.querySelector('.tab-btn[data-tab="' + name + '"]');
    if (active) { active.classList.add('active'); active.classList.remove('text-zinc-400'); }
}

// ========== 스튜디오 ==========
function handleFile(file) {
    if (!file.type.startsWith('image/')) return alert('이미지 파일만 지원합니다.');
    var reader = new FileReader();
    reader.onload = function (e) {
        state.currentImage = e.target.result;
        document.getElementById('previewImage').src = e.target.result;
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('uploadPlaceholder').classList.add('hidden');
        document.getElementById('previewContainer').classList.remove('hidden');
        document.getElementById('clearImageBtn').classList.remove('hidden');
        document.getElementById('generateBtn').disabled = false;
    };
    reader.readAsDataURL(file);
}

function clearImage() {
    state.currentImage = null;
    document.getElementById('uploadPlaceholder').classList.remove('hidden');
    document.getElementById('previewContainer').classList.add('hidden');
    document.getElementById('clearImageBtn').classList.add('hidden');
    document.getElementById('generateBtn').disabled = true;
    document.getElementById('fileInput').value = '';
}

function setMode(mode) {
    state.currentMode = mode;
    document.getElementById('modeProduct').className = mode === 'product' ? 'py-2.5 text-xs font-bold rounded-lg bg-white shadow-sm' : 'py-2.5 text-xs font-bold rounded-lg text-zinc-400';
    document.getElementById('modeModel').className = mode === 'model' ? 'py-2.5 text-xs font-bold rounded-lg bg-white shadow-sm' : 'py-2.5 text-xs font-bold rounded-lg text-zinc-400';
    document.getElementById('genderSection').classList.toggle('hidden', mode === 'product');
}

function setGender(gender) {
    state.currentGender = gender;
    document.getElementById('genderFemale').className = gender === '여성' ? 'py-2.5 text-xs font-bold rounded-lg bg-zinc-900 text-white' : 'py-2.5 text-xs font-bold rounded-lg text-zinc-400';
    document.getElementById('genderMale').className = gender === '남성' ? 'py-2.5 text-xs font-bold rounded-lg bg-zinc-900 text-white' : 'py-2.5 text-xs font-bold rounded-lg text-zinc-400';
}

function generateImage() {
    if (!state.currentImage || !state.apiReady) return;

    // 웹 API 연동 확인
    if (!state.useWebApi || !state.webApiKey) {
        alert('⚠️ API 키가 연동되지 않았습니다.\n\n설정 탭에서 웹 API 키를 연동해주세요.');
        switchTab('settings');
        return;
    }

    showLoading(true);
    callApi('generate_image', state.currentImage, state.currentMode, state.currentGender, document.getElementById('categorySelect').value)
        .then(function (r) {
            showLoading(false);
            if (r && r.success) {
                displayResults(r.images);
                // 크레딧 업데이트
                if (typeof r.remaining_credits !== 'undefined') {
                    state.webCredits = r.remaining_credits;
                    updateWebApiStatusUI();
                }
            } else {
                alert('생성 실패: ' + (r ? r.error : ''));
            }
        })
        .catch(function (e) { showLoading(false); alert('오류: ' + e.message); });
}

function showLoading(show) {
    document.getElementById('emptyState').classList.toggle('hidden', show || state.generatedImages.length > 0);
    document.getElementById('loadingState').classList.toggle('hidden', !show);
    document.getElementById('resultGrid').classList.toggle('hidden', show || !state.generatedImages.length);
    document.getElementById('generateBtn').disabled = show;
    document.getElementById('generateBtnText').textContent = show ? '생성 중...' : '이미지 생성하기';
    document.getElementById('generateBtnLoading').classList.toggle('hidden', !show);
    document.getElementById('generateBtnIcon').classList.toggle('hidden', show);
}

function displayResults(images) {
    state.generatedImages = images;
    var labels = ['정면', '측면', '후면', '디테일'];
    var html = '';
    images.forEach(function (img, i) {
        html += '<div class="image-card rounded-2xl overflow-hidden bg-white shadow-lg" onclick="openImageModal(' + i + ')"><img src="' + img + '" class="w-full aspect-square object-cover"><div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4"><span class="text-white font-bold">' + labels[i] + '</span></div></div>';
    });
    document.getElementById('resultGrid').innerHTML = html;
    document.getElementById('resultGrid').classList.remove('hidden');
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('downloadAllBtn').disabled = false;
    document.getElementById('canvasInfo').textContent = images.length + '장 생성됨';
    addToHistory(images);
}

function addToHistory(images) {
    var list = document.getElementById('historyList');
    var time = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    var item = document.createElement('div');
    item.className = 'p-2 bg-zinc-50 rounded-xl mb-2 cursor-pointer hover:bg-zinc-100';
    item.innerHTML = '<div class="flex gap-1 mb-1">' + images.slice(0, 4).map(function (img) { return '<img src="' + img + '" class="w-8 h-8 rounded object-cover">'; }).join('') + '</div><p class="text-xs text-zinc-500">' + time + '</p>';
    item.onclick = function () { displayResults(images); };
    if (list.querySelector('p')) list.innerHTML = '';
    list.insertBefore(item, list.firstChild);
}

function openImageModal(idx) {
    document.getElementById('modalImage').src = state.generatedImages[idx];
    document.getElementById('modalLabel').textContent = ['정면', '측면', '후면', '디테일'][idx];
    document.getElementById('imageModal').classList.remove('hidden');
}

function closeImageModal() { document.getElementById('imageModal').classList.add('hidden'); }

function downloadModalImage() {
    var src = document.getElementById('modalImage').src;
    callApi('save_image', src, 'autopic_image.jpg');
}

function downloadAll() {
    if (!state.generatedImages.length) return;
    callApi('save_all_images', state.generatedImages).then(function (r) { if (r && r.success) alert(r.count + '개 저장됨'); });
}

// ========== 일괄처리 ==========
function setBatchGender(gender) {
    state.batchGender = gender;
    ['auto', '여성', '남성'].forEach(function (g) {
        var btn = document.getElementById('batchGender' + (g === 'auto' ? 'Auto' : g));
        if (btn) btn.className = 'batch-gender-btn px-3 py-1.5 text-xs font-bold rounded-lg ' + (g === gender ? 'bg-lime-400 text-zinc-900' : 'bg-zinc-100 text-zinc-600');
    });
}

function selectBatchFolder() {
    callApi('select_folder').then(function (r) {
        if (r && r.success) {
            state.batchFolder = r.folder;
            document.getElementById('batchFolderInput').value = r.folder;
            refreshProductList();
            checkBatchState();
        }
    });
}

function openBatchFolder() { if (state.batchFolder) callApi('open_folder', state.batchFolder); }

function checkBatchState() {
    if (!state.batchFolder) return;
    callApi('check_batch_state', state.batchFolder).then(function (r) {
        if (r && r.has_state && r.remaining > 0) {
            document.getElementById('resumeAlert').classList.remove('hidden');
            document.getElementById('resumeInfo').textContent = r.current_index + '/' + r.total + ' 완료, ' + r.remaining + '개 남음';
        } else {
            document.getElementById('resumeAlert').classList.add('hidden');
        }
    });
}

function resumeBatch() {
    setBatchBtnProcessing(true, 0, 1);
    callApi('resume_batch_process', state.batchFolder).then(handleBatchResult).catch(handleBatchError);
}

function clearBatchState() {
    callApi('clear_batch_state', state.batchFolder).then(function () { document.getElementById('resumeAlert').classList.add('hidden'); });
}

function refreshProductList() {
    if (!state.batchFolder) return;
    callApi('get_product_list', state.batchFolder).then(function (r) {
        if (r && r.success) { state.products = r.products; renderProductTable(); }
    });
}

function renderProductTable() {
    var tbody = document.getElementById('productTableBody');
    if (!state.products.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-zinc-400">상품 폴더가 없습니다</td></tr>';
        document.getElementById('productCount').textContent = '0개';
        return;
    }
    var html = '';
    state.products.forEach(function (p, i) {
        var complete = p.has_output && p.output_count >= 4;
        var statusHtml = complete
            ? '<span class="px-2 py-1 bg-lime-100 text-lime-700 rounded-lg text-xs font-bold cursor-pointer hover:bg-lime-200" onclick="event.stopPropagation(); showPreviewModal(\'' + p.path.replace(/\\/g, '\\\\') + '\')">👁️ 완료(' + p.output_count + ')</span>'
            : '<span class="px-2 py-1 bg-zinc-100 text-zinc-500 rounded-lg text-xs">대기</span>';
        html += '<tr class="border-t border-zinc-100 ' + (complete ? 'opacity-50' : 'hover:bg-zinc-50 cursor-pointer') + '" onclick="toggleRowCheck(this, ' + complete + ')" data-idx="' + i + '">' +
            '<td class="p-3 text-center" onclick="event.stopPropagation()"><input type="checkbox" class="product-check w-4 h-4 accent-lime-500" data-idx="' + i + '" ' + (complete ? 'disabled' : '') + '></td>' +
            '<td class="p-3 font-medium">' + p.name + '</td>' +
            '<td class="p-3 text-center">' + p.image_count + '</td>' +
            '<td class="p-3 text-center">' + (p.has_text ? '✅' : '❌') + '</td>' +
            '<td class="p-3 text-center">' + statusHtml + '</td></tr>';
    });
    tbody.innerHTML = html;
    document.getElementById('productCount').textContent = state.products.length + '개';
}

function toggleRowCheck(row, complete) {
    if (complete) return;
    var cb = row.querySelector('.product-check');
    if (cb && !cb.disabled) cb.checked = !cb.checked;
}

function toggleSelectAll() {
    var cbs = document.querySelectorAll('.product-check:not(:disabled)');
    var allChecked = Array.from(cbs).every(function (cb) { return cb.checked; });
    cbs.forEach(function (cb) { cb.checked = !allChecked; });
}

function startBatchProcess() {
    if (!state.apiReady) return alert('API가 준비되지 않았습니다.');
    if (!state.batchFolder) return alert('폴더를 먼저 선택하세요.');
    if (state.batchProcessing) return;

    // 웹 API 연동 확인
    if (!state.useWebApi || !state.webApiKey) {
        alert('⚠️ API 키가 연동되지 않았습니다.\n\n설정 탭에서 웹 API 키를 연동해주세요.');
        switchTab('settings');
        return;
    }

    var selected = document.querySelectorAll('.product-check:checked');
    if (!selected.length) return alert('처리할 상품을 선택하세요.');

    var names = Array.from(selected).map(function (cb) { return state.products[cb.dataset.idx].name; });
    var options = {
        basic_product: document.getElementById('optBasicProduct').checked,
        basic_model: document.getElementById('optBasicModel').checked,
        editorial_product: document.getElementById('optEditorialProduct').checked,
        editorial_model: document.getElementById('optEditorialModel').checked,
        gender: state.batchGender
    };

    // 즉시 UI 반응
    setBatchBtnProcessing(true, 0, names.length);

    callApi('process_batch', state.batchFolder, names, options).then(handleBatchResult).catch(handleBatchError);
}

function setBatchBtnProcessing(processing, current, total) {
    state.batchProcessing = processing;
    var btn = document.getElementById('batchStartBtn');
    var icon = document.getElementById('batchBtnIcon');
    var text = document.getElementById('batchBtnText');
    var progress = document.getElementById('batchProgress');
    var progressText = document.getElementById('batchProgressText');
    var stopBtn = document.getElementById('batchStopBtn');

    if (processing) {
        btn.disabled = true;
        btn.classList.add('opacity-60');
        stopBtn.disabled = false;
        stopBtn.classList.remove('opacity-50');
        stopBtn.innerHTML = '⏹️ 중지';
        icon.innerHTML = '<svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>';

        // 시작 시 즉시 5% 표시
        var percent = current === 0 ? 5 : Math.round((current / total) * 90 + 10);
        progress.style.width = percent + '%';
        text.textContent = current === 0 ? '⏳ 준비 중...' : '⏳ 처리 중... (' + current + '/' + total + ')';
        progressText.textContent = current === 0 ? '준비 중...' : current + '/' + total + ' 처리 중';
        progressText.classList.add('animate-pulse');
    } else {
        btn.disabled = false;
        btn.classList.remove('opacity-60');
        stopBtn.disabled = true;
        stopBtn.classList.remove('opacity-50');
        stopBtn.innerHTML = '⏹️ 중지';
        icon.textContent = '🚀';
        text.textContent = '처리 시작';
        progressText.classList.remove('animate-pulse');
    }
}

function handleBatchResult(r) {
    setBatchBtnProcessing(false, 0, 0);
    
    // 버튼 텍스트 즉시 초기화
    document.getElementById('batchBtnText').textContent = '🚀 처리 시작';
    document.getElementById('batchBtnIcon').textContent = '🚀';
    
    // 크레딧 부족 에러 처리
    if (r && r.error_type === 'insufficient_credits') {
        var msg = '⚠️ 크레딧이 부족합니다!\n\n';
        msg += '보유 크레딧: ' + r.current_credits + '\n';
        msg += '필요 크레딧: ' + r.required_credits + '\n\n';
        if (r.possible_count > 0) {
            msg += '현재 크레딧으로 ' + r.possible_count + '개 상품만 처리 가능합니다.\n';
            msg += '상품 수를 줄이거나 크레딧을 충전해주세요.';
        } else {
            msg += '크레딧을 충전해주세요.\n';
            msg += '→ 설정 탭 > 크레딧 충전';
        }
        alert(msg);
        document.getElementById('batchProgress').style.width = '0%';
        document.getElementById('batchProgressText').textContent = '크레딧 부족';
        return;
    }
    
    if (r && r.success) {
        if (r.was_stopped) {
            document.getElementById('batchProgress').style.width = Math.round((r.success_count / r.total) * 100) + '%';
            document.getElementById('batchProgressText').textContent = '중단됨 (' + r.success_count + '/' + r.total + ' 완료)';
        } else {
            document.getElementById('batchProgress').style.width = '100%';
            document.getElementById('batchProgressText').textContent = '✅ 완료! (' + r.success_count + '/' + r.total + ')';
        }
        showCompleteModal(r.success_count, r.fail_count, r.total, r.was_stopped);
        refreshProductList();
        checkBatchState();
        checkWebCredits();
        
        setTimeout(function() {
            document.getElementById('batchProgress').style.width = '0%';
            document.getElementById('batchProgressText').textContent = '대기 중';
        }, 3000);
    } else {
        document.getElementById('batchProgress').style.width = '0%';
        document.getElementById('batchProgressText').textContent = '오류 발생';
        alert('처리 실패: ' + (r ? r.error : ''));
    }
}
function handleBatchError(e) {
    setBatchBtnProcessing(false, 0, 0);
    document.getElementById('batchProgressText').textContent = '오류 발생';
    alert('오류: ' + e.message);
}

function stopBatchProcess() {
    var stopBtn = document.getElementById('batchStopBtn');
    stopBtn.disabled = true;
    stopBtn.classList.add('opacity-50');
    stopBtn.innerHTML = '<span class="animate-pulse">⏳ 중지 중...</span>';
    document.getElementById('batchProgressText').textContent = '중지 요청됨...';

    callApi('stop_batch').then(function (r) {
        if (r && r.success) {
            // 중지 요청 완료 - 배치 처리가 끝나면 handleBatchResult가 호출됨
            console.log('중지 요청 완료');
        }
    }).catch(function (e) {
        console.error('중지 요청 실패:', e);
        stopBtn.disabled = false;
        stopBtn.classList.remove('opacity-50');
        stopBtn.innerHTML = '⏹️ 중지';
    });
}

function showCompleteModal(success, fail, total, wasStopped) {
    var html = '';
    if (wasStopped) {
        html += '<p class="text-amber-500 text-lg font-bold mb-2">⚠️ 사용자 요청으로 중단됨</p>';
    }
    html += '<p class="text-2xl"><span class="text-lime-500 font-black">' + success + '</span> / ' + total + ' 성공</p>';
    if (fail > 0) html += '<p class="text-red-500 mt-2">실패: ' + fail + '개</p>';
    if (wasStopped && (total - success - fail) > 0) {
        html += '<p class="text-zinc-400 mt-2">미처리: ' + (total - success - fail) + '개</p>';
    }
    document.getElementById('completeStats').innerHTML = html;
    document.getElementById('completeModal').classList.remove('hidden');
}

function hideCompleteModal() { document.getElementById('completeModal').classList.add('hidden'); }

// ========== 미리보기 모달 ==========
function showPreviewModal(folderPath) {
    callApi('get_product_preview', folderPath).then(function (r) {
        if (!r || !r.success) return alert('미리보기 로드 실패');

        state.currentPreview = { folder: folderPath, images: r.images };
        document.getElementById('previewModalTitle').textContent = '📦 ' + r.name;

        var types = ['basic_product', 'basic_model', 'editorial_product', 'editorial_model'];
        var labels = { 'basic_product': '🛍️ 기본 정물', 'basic_model': '👤 기본 모델', 'editorial_product': '📸 화보 정물', 'editorial_model': '🎭 화보 모델' };

        var html = '';
        types.forEach(function (type) {
            var imgs = r.images[type];
            if (!imgs || !imgs.length) return;

            html += '<div class="mb-6"><div class="flex items-center justify-between mb-3">' +
                '<h4 class="font-bold text-sm">' + labels[type] + ' (' + imgs.length + '장)</h4>' +
                '<button onclick="regenerateType(\'' + type + '\')" class="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-400">🔄 4장 재생성</button></div>' +
                '<div class="grid grid-cols-4 gap-3">';

            imgs.forEach(function (img) {
                html += '<div class="rounded-xl overflow-hidden bg-zinc-100 cursor-pointer hover:ring-2 hover:ring-lime-400" onclick="openPreviewImage(\'' + img.thumbnail.replace(/'/g, "\\'") + '\')">' +
                    '<img src="' + img.thumbnail + '" class="w-full aspect-square object-contain"></div>';
            });

            html += '</div></div>';
        });

        if (!html) html = '<p class="text-center text-zinc-400 py-8">생성된 이미지가 없습니다</p>';

        document.getElementById('previewModalContent').innerHTML = html;
        document.getElementById('previewModal').classList.remove('hidden');
    });
}

function closePreviewModal() { document.getElementById('previewModal').classList.add('hidden'); state.currentPreview = null; }

function openPreviewImage(src) {
    document.getElementById('modalImage').src = src;
    document.getElementById('modalLabel').textContent = '미리보기';
    document.getElementById('imageModal').classList.remove('hidden');
}

function regenerateType(imageType) {
    if (!state.currentPreview) return;

    document.getElementById('regenModal').classList.remove('hidden');

    // 4장 세트 재생성 (index 0~3)
    callApi('regenerate_single_image', state.currentPreview.folder, imageType, 0, { gender: state.batchGender })
        .then(function (r) {
            document.getElementById('regenModal').classList.add('hidden');
            if (r && r.success) {
                alert(imageType + ' 4장 재생성 완료!');
                showPreviewModal(state.currentPreview.folder); // 새로고침
            } else {
                alert('재생성 실패: ' + (r ? r.error : ''));
            }
        })
        .catch(function (e) {
            document.getElementById('regenModal').classList.add('hidden');
            alert('오류: ' + e.message);
        });
}

// ========== 설정 ==========
function toggleApiKeyVisibility() {
    var show = document.getElementById('showApiKeys').checked;
    document.getElementById('settingsGeminiKey').type = show ? 'text' : 'password';
    document.getElementById('settingsClaudeKey').type = show ? 'text' : 'password';
}

function saveApiSettings() {
    callApi('save_api_keys', document.getElementById('settingsClaudeKey').value.trim(), document.getElementById('settingsGeminiKey').value.trim())
        .then(function (r) { if (r && r.success) { alert('저장됨'); updateApiStatus(true); } else alert('실패'); });
}

function renderBrandList() {
    var el = document.getElementById('brandList');
    if (!state.brands.length) { el.innerHTML = '<p class="text-sm text-zinc-400">등록된 브랜드가 없습니다</p>'; return; }
    el.innerHTML = '<div class="flex flex-wrap gap-2">' + state.brands.map(function (b, i) {
        return '<span class="px-3 py-1 bg-zinc-100 rounded-lg text-sm">' + b + '<button onclick="removeBrand(' + i + ')" class="ml-2 text-zinc-400 hover:text-red-500">&times;</button></span>';
    }).join('') + '</div>';
}

function addBrand() {
    var input = document.getElementById('newBrandInput');
    var brand = input.value.trim();
    if (brand && state.brands.indexOf(brand) === -1) { state.brands.push(brand); renderBrandList(); saveBrandsAndCategories(); }
    input.value = '';
}

function removeBrand(i) { state.brands.splice(i, 1); renderBrandList(); saveBrandsAndCategories(); }

function updateCategory1Select() {
    var sel = document.getElementById('category1Select');
    sel.innerHTML = '<option value="">1차 선택</option>' + Object.keys(state.categories).map(function (k) { return '<option value="' + k + '">' + k + '</option>'; }).join('');
}

function renderCategoryList() {
    var el = document.getElementById('categoryList');
    var keys = Object.keys(state.categories);
    if (!keys.length) { el.innerHTML = '<p class="text-sm text-zinc-400">등록된 카테고리가 없습니다</p>'; return; }
    el.innerHTML = keys.map(function (p) {
        var secs = state.categories[p] || [];
        return '<div class="bg-zinc-50 rounded-xl p-3"><div class="flex justify-between mb-2"><span class="font-bold text-sm">📁 ' + p + '</span><button onclick="removeCategory1(\'' + p + '\')" class="text-xs text-zinc-400 hover:text-red-500">삭제</button></div>' +
            (secs.length ? '<div class="flex flex-wrap gap-1">' + secs.map(function (s) { return '<span class="px-2 py-0.5 bg-lime-100 text-lime-700 rounded text-xs">' + s + '<button onclick="removeCategory2(\'' + p + '\',\'' + s + '\')" class="ml-1 hover:text-red-500">&times;</button></span>'; }).join('') + '</div>' : '<p class="text-xs text-zinc-400">2차 카테고리 없음</p>') + '</div>';
    }).join('');
}

function addCategory1() {
    var input = document.getElementById('newCategory1Input');
    var cat = input.value.trim();
    if (cat && !state.categories[cat]) { state.categories[cat] = []; renderCategoryList(); updateCategory1Select(); saveBrandsAndCategories(); }
    input.value = '';
}

function removeCategory1(p) { if (confirm(p + ' 삭제?')) { delete state.categories[p]; renderCategoryList(); updateCategory1Select(); saveBrandsAndCategories(); } }

function addCategory2() {
    var p = document.getElementById('category1Select').value;
    var s = document.getElementById('newCategory2Input').value.trim();
    if (!p) return alert('1차 카테고리를 선택하세요.');
    if (s && (!state.categories[p] || state.categories[p].indexOf(s) === -1)) {
        if (!state.categories[p]) state.categories[p] = [];
        state.categories[p].push(s);
        renderCategoryList();
        saveBrandsAndCategories();
    }
    document.getElementById('newCategory2Input').value = '';
}

function removeCategory2(p, s) {
    var idx = state.categories[p].indexOf(s);
    if (idx > -1) { state.categories[p].splice(idx, 1); renderCategoryList(); saveBrandsAndCategories(); }
}

function saveBrandsAndCategories() { callApi('save_brands_categories', state.brands, state.categories); }

function clearLogs() { document.getElementById('logContent').innerHTML = ''; callApi('clear_logs'); }

// ========== 업종 설정 ==========
function setBusinessType(type) {
    state.businessType = type;
    state.useBrand = (type === 'luxury');
    updateBusinessTypeUI();
    callApi('save_business_type', type).then(function (r) {
        if (r && r.success) {
            console.log('업종 설정 저장 완료:', type);
        }
    });
}

function updateBusinessTypeUI() {
    var luxuryBtn = document.getElementById('bizTypeLuxury');
    var generalBtn = document.getElementById('bizTypeGeneral');
    var noteEl = document.getElementById('brandSettingNote');
    var brandSection = document.querySelector('[id="brandList"]').closest('.bg-white');

    if (state.businessType === 'luxury') {
        luxuryBtn.className = 'biz-type-btn p-4 border-2 border-lime-400 bg-lime-50 rounded-xl text-left';
        generalBtn.className = 'biz-type-btn p-4 border-2 border-zinc-200 bg-white rounded-xl text-left hover:border-zinc-300';
        noteEl.innerHTML = '<span>✅</span><span class="text-sm text-lime-700 font-medium">브랜드 필드가 <strong>사용</strong>됩니다</span>';
        noteEl.className = 'flex items-center gap-2 p-3 bg-lime-50 rounded-xl';
        if (brandSection) brandSection.style.display = 'block';
    } else {
        luxuryBtn.className = 'biz-type-btn p-4 border-2 border-zinc-200 bg-white rounded-xl text-left hover:border-zinc-300';
        generalBtn.className = 'biz-type-btn p-4 border-2 border-lime-400 bg-lime-50 rounded-xl text-left';
        noteEl.innerHTML = '<span>❌</span><span class="text-sm text-zinc-500 font-medium">브랜드 필드가 <strong>사용되지 않습니다</strong></span>';
        noteEl.className = 'flex items-center gap-2 p-3 bg-zinc-100 rounded-xl';
        if (brandSection) brandSection.style.display = 'none';
    }
}

// ========== 이미지 모델 설정 ==========
function setImageModel(model) {
    state.imageModel = model;
    updateImageModelUI();
    callApi('save_image_model', model).then(function (r) {
        if (r && r.success) {
            console.log('이미지 모델 설정 저장 완료:', model);
        }
    });
}

function updateImageModelUI() {
    var proBtn = document.getElementById('modelPro');
    var flashBtn = document.getElementById('modelFlash');
    var noteEl = document.getElementById('modelSettingNote');

    if (state.imageModel === 'gemini-3-pro') {
        proBtn.className = 'model-btn p-4 border-2 border-lime-400 bg-lime-50 rounded-xl text-left';
        flashBtn.className = 'model-btn p-4 border-2 border-zinc-200 bg-white rounded-xl text-left hover:border-zinc-300';
        noteEl.innerHTML = '<span>✨</span><span class="text-sm text-lime-700 font-medium">Premium 모델 사용 중 (3크레딧/고화질)</span>';
        noteEl.className = 'flex items-center gap-2 p-3 bg-lime-50 rounded-xl';
    } else {
        proBtn.className = 'model-btn p-4 border-2 border-zinc-200 bg-white rounded-xl text-left hover:border-zinc-300';
        flashBtn.className = 'model-btn p-4 border-2 border-lime-400 bg-lime-50 rounded-xl text-left';
        noteEl.innerHTML = '<span>⚡</span><span class="text-sm text-amber-700 font-medium">Standard 모델 사용 중 (1크레딧/고속)</span>';
        noteEl.className = 'flex items-center gap-2 p-3 bg-amber-50 rounded-xl';
    }
}

// ========== 웹 API 연동 ==========
function saveWebApiKey() {
    var apiKey = document.getElementById('webApiKeyInput').value.trim();
    var apiUrl = 'http://43.200.229.169:8000';  // AWS 서버 URL
    var btn = document.querySelector('#webApiDisconnected button');

    if (!apiKey) {
        alert('API 키를 입력하세요.');
        return;
    }

    if (!apiKey.startsWith('ap_')) {
        alert('API 키 형식이 올바르지 않습니다.\nap_xxxx... 형식의 키를 입력해주세요.');
        return;
    }

    // 로딩 표시
    var originalText = btn.innerHTML;
    btn.innerHTML = '<span class="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></span> 연동 중...';
    btn.disabled = true;

    callApi('save_web_api_key', apiKey, apiUrl).then(function (r) {
        btn.innerHTML = originalText;
        btn.disabled = false;

        if (r && r.success) {
            state.webApiKey = apiKey;
            state.webApiUrl = apiUrl;
            state.useWebApi = true;
            state.webCredits = r.credits || 0;
            updateWebApiStatusUI();
            alert('✅ ' + (r.message || '연동 완료!'));
        } else {
            alert('❌ 연동 실패: ' + (r ? r.error : '알 수 없는 오류'));
        }
    }).catch(function (e) {
        btn.innerHTML = originalText;
        btn.disabled = false;
        alert('❌ 오류: ' + e.message);
    });
}

function checkWebCredits() {
    var btn = document.querySelector('#webApiConnected button');
    var originalText = btn.innerHTML;
    btn.innerHTML = '<span class="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></span> 확인 중...';
    btn.disabled = true;

    callApi('check_web_credits').then(function (r) {
        btn.innerHTML = originalText;
        btn.disabled = false;

        if (r && r.success) {
            state.webCredits = r.credits || 0;
            state.useWebApi = true;
            updateWebApiStatusUI();
        } else {
            alert('크레딧 조회 실패: ' + (r ? r.error : ''));
        }
    }).catch(function (e) {
        btn.innerHTML = originalText;
        btn.disabled = false;
        alert('오류: ' + e.message);
    });
}

function disconnectWebApi() {
    if (!confirm('웹 API 연동을 해제하시겠습니까?\n\n해제 후에는 이미지 생성을 할 수 없습니다.')) return;

    callApi('save_web_api_key', '', '').then(function (r) {
        if (r && r.success) {
            state.webApiKey = '';
            state.useWebApi = false;
            state.webCredits = 0;
            document.getElementById('webApiKeyInput').value = '';
            updateWebApiStatusUI();
            alert('연동이 해제되었습니다.');
        }
    });
}

function toggleWebApiKeyVisibility() {
    var show = document.getElementById('showWebApiKey').checked;
    document.getElementById('webApiKeyInput').type = show ? 'text' : 'password';
}

function updateWebApiStatusUI() {
    var statusEl = document.getElementById('webApiStatus');
    var disconnectedEl = document.getElementById('webApiDisconnected');
    var connectedEl = document.getElementById('webApiConnected');
    var creditsValueEl = document.getElementById('webApiCreditsValue');
    var sectionEl = document.getElementById('webApiSection');

    if (state.useWebApi && state.webApiKey) {
        // 연결됨 상태
        statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-lime-400 animate-pulse"></span><span class="text-xs font-medium">✅ 연결됨</span>';
        sectionEl.className = 'bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-6 shadow-lg text-white';
        disconnectedEl.classList.add('hidden');
        connectedEl.classList.remove('hidden');
        creditsValueEl.textContent = state.webCredits.toLocaleString();
    } else {
        // 미연결 상태
        statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-white/50"></span><span class="text-xs font-medium">미연결</span>';
        sectionEl.className = 'bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-6 shadow-lg text-white';
        disconnectedEl.classList.remove('hidden');
        connectedEl.classList.add('hidden');
    }

    // 헤더 상태도 업데이트
    updateApiStatus(state.useWebApi && state.webApiKey);
}
