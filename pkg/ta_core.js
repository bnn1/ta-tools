
let imports = {};
imports['__wbindgen_placeholder__'] = module.exports;

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

function dropObject(idx) {
    if (idx < 132) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function getArrayF64FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat64ArrayMemory0().subarray(ptr / 8, ptr / 8 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

let cachedFloat64ArrayMemory0 = null;
function getFloat64ArrayMemory0() {
    if (cachedFloat64ArrayMemory0 === null || cachedFloat64ArrayMemory0.byteLength === 0) {
        cachedFloat64ArrayMemory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function getObject(idx) { return heap[idx]; }

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_export2(addHeapObject(e));
    }
}

let heap = new Array(128).fill(undefined);
heap.push(undefined, null, true, false);

let heap_next = heap.length;

function isLikeNone(x) {
    return x === undefined || x === null;
}

function passArrayF64ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 8, 8) >>> 0;
    getFloat64ArrayMemory0().set(arg, ptr / 8);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
function decodeText(ptr, len) {
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    }
}

let WASM_VECTOR_LEN = 0;

const AdxStreamFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_adxstream_free(ptr >>> 0, 1));

const AnchoredVwapStreamFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_anchoredvwapstream_free(ptr >>> 0, 1));

const AtrStreamFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_atrstream_free(ptr >>> 0, 1));

const BBandsStreamFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_bbandsstream_free(ptr >>> 0, 1));

const CvdOhlcvStreamFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_cvdohlcvstream_free(ptr >>> 0, 1));

const CvdStreamFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_cvdstream_free(ptr >>> 0, 1));

const EmaStreamFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_emastream_free(ptr >>> 0, 1));

const FrvpOutputFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_frvpoutput_free(ptr >>> 0, 1));

const FrvpStreamFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_frvpstream_free(ptr >>> 0, 1));

const HmaStreamFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_hmastream_free(ptr >>> 0, 1));

const IchimokuStreamFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_ichimokustream_free(ptr >>> 0, 1));

const LinRegStreamFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_linregstream_free(ptr >>> 0, 1));

const MacdStreamFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_macdstream_free(ptr >>> 0, 1));

const MfiStreamFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_mfistream_free(ptr >>> 0, 1));

const RollingVwapStreamFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_rollingvwapstream_free(ptr >>> 0, 1));

const RsiStreamFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_rsistream_free(ptr >>> 0, 1));

const SessionVwapStreamFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_sessionvwapstream_free(ptr >>> 0, 1));

const SmaStreamFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_smastream_free(ptr >>> 0, 1));

const StochFastStreamFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_stochfaststream_free(ptr >>> 0, 1));

const StochRsiStreamFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_stochrsistream_free(ptr >>> 0, 1));

const StochSlowStreamFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_stochslowstream_free(ptr >>> 0, 1));

const VolumeProfileRowFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_volumeprofilerow_free(ptr >>> 0, 1));

const WasmAdxOutputFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmadxoutput_free(ptr >>> 0, 1));

const WasmBBandsOutputFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmbbandsoutput_free(ptr >>> 0, 1));

const WasmIchimokuOutputFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmichimokuoutput_free(ptr >>> 0, 1));

const WasmLinRegOutputFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmlinregoutput_free(ptr >>> 0, 1));

const WasmMacdOutputFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmmacdoutput_free(ptr >>> 0, 1));

const WasmPivotPointsOutputFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmpivotpointsoutput_free(ptr >>> 0, 1));

const WasmStochOutputFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmstochoutput_free(ptr >>> 0, 1));

const WasmStochRsiOutputFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmstochrsioutput_free(ptr >>> 0, 1));

const WmaStreamFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wmastream_free(ptr >>> 0, 1));

/**
 * Streaming ADX calculator.
 */
class AdxStream {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AdxStreamFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_adxstream_free(ptr, 0);
    }
    /**
     * Initialize with historical data.
     * @param {Float64Array} highs
     * @param {Float64Array} lows
     * @param {Float64Array} closes
     * @returns {any}
     */
    init(highs, lows, closes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArrayF64ToWasm0(highs, wasm.__wbindgen_export3);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passArrayF64ToWasm0(lows, wasm.__wbindgen_export3);
            const len1 = WASM_VECTOR_LEN;
            const ptr2 = passArrayF64ToWasm0(closes, wasm.__wbindgen_export3);
            const len2 = WASM_VECTOR_LEN;
            wasm.adxstream_init(retptr, this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a new streaming ADX calculator.
     * @param {number} period
     */
    constructor(period) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.adxstream_new(retptr, period);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            this.__wbg_ptr = r0 >>> 0;
            AdxStreamFinalization.register(this, this.__wbg_ptr, this);
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Process next bar.
     * @param {number} high
     * @param {number} low
     * @param {number} close
     * @returns {WasmAdxOutput | undefined}
     */
    next(high, low, close) {
        const ret = wasm.adxstream_next(this.__wbg_ptr, high, low, close);
        return ret === 0 ? undefined : WasmAdxOutput.__wrap(ret);
    }
    /**
     * Reset the calculator.
     */
    reset() {
        wasm.adxstream_reset(this.__wbg_ptr);
    }
    /**
     * Get the period.
     * @returns {number}
     */
    get period() {
        const ret = wasm.adxstream_period(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Get current values.
     * @returns {WasmAdxOutput | undefined}
     */
    current() {
        const ret = wasm.adxstream_current(this.__wbg_ptr);
        return ret === 0 ? undefined : WasmAdxOutput.__wrap(ret);
    }
    /**
     * Check if ready.
     * @returns {boolean}
     */
    isReady() {
        const ret = wasm.adxstream_isReady(this.__wbg_ptr);
        return ret !== 0;
    }
}
if (Symbol.dispose) AdxStream.prototype[Symbol.dispose] = AdxStream.prototype.free;
exports.AdxStream = AdxStream;

/**
 * Streaming Anchored VWAP calculator.
 */
class AnchoredVwapStream {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(AnchoredVwapStream.prototype);
        obj.__wbg_ptr = ptr;
        AnchoredVwapStreamFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AnchoredVwapStreamFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_anchoredvwapstream_free(ptr, 0);
    }
    /**
     * Anchor at the next candle received.
     */
    anchorNow() {
        wasm.anchoredvwapstream_anchorNow(this.__wbg_ptr);
    }
    /**
     * Set the anchor timestamp. VWAP will start accumulating from this point.
     * @param {number} timestamp
     */
    setAnchor(timestamp) {
        wasm.anchoredvwapstream_setAnchor(this.__wbg_ptr, timestamp);
    }
    /**
     * Create a new streaming Anchored VWAP calculator with a specific anchor timestamp.
     * @param {number} anchor_timestamp
     * @returns {AnchoredVwapStream}
     */
    static withAnchor(anchor_timestamp) {
        const ret = wasm.anchoredvwapstream_withAnchor(anchor_timestamp);
        return AnchoredVwapStream.__wrap(ret);
    }
    /**
     * Initialize with historical OHLCV data.
     * Returns array of VWAP values.
     * @param {Float64Array} timestamps
     * @param {Float64Array} opens
     * @param {Float64Array} highs
     * @param {Float64Array} lows
     * @param {Float64Array} closes
     * @param {Float64Array} volumes
     * @returns {Float64Array}
     */
    init(timestamps, opens, highs, lows, closes, volumes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArrayF64ToWasm0(timestamps, wasm.__wbindgen_export3);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passArrayF64ToWasm0(opens, wasm.__wbindgen_export3);
            const len1 = WASM_VECTOR_LEN;
            const ptr2 = passArrayF64ToWasm0(highs, wasm.__wbindgen_export3);
            const len2 = WASM_VECTOR_LEN;
            const ptr3 = passArrayF64ToWasm0(lows, wasm.__wbindgen_export3);
            const len3 = WASM_VECTOR_LEN;
            const ptr4 = passArrayF64ToWasm0(closes, wasm.__wbindgen_export3);
            const len4 = WASM_VECTOR_LEN;
            const ptr5 = passArrayF64ToWasm0(volumes, wasm.__wbindgen_export3);
            const len5 = WASM_VECTOR_LEN;
            wasm.anchoredvwapstream_init(retptr, this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, ptr5, len5);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v7 = getArrayF64FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export(r0, r1 * 8, 8);
            return v7;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the anchor timestamp if set.
     * @returns {number | undefined}
     */
    anchorTimestamp() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.anchoredvwapstream_anchorTimestamp(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r2 = getDataViewMemory0().getFloat64(retptr + 8 * 1, true);
            return r0 === 0 ? undefined : r2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get cumulative volume.
     * @returns {number}
     */
    cumulativeVolume() {
        const ret = wasm.anchoredvwapstream_cumulativeVolume(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get cumulative typical price × volume.
     * @returns {number}
     */
    cumulativeTpVolume() {
        const ret = wasm.anchoredvwapstream_cumulativeTpVolume(this.__wbg_ptr);
        return ret;
    }
    /**
     * Create a new streaming Anchored VWAP calculator.
     * Use `setAnchor()` or `anchorNow()` to set the anchor point.
     */
    constructor() {
        const ret = wasm.anchoredvwapstream_new();
        this.__wbg_ptr = ret >>> 0;
        AnchoredVwapStreamFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Process next candle. Returns VWAP value or undefined if before anchor.
     * @param {number} timestamp
     * @param {number} open
     * @param {number} high
     * @param {number} low
     * @param {number} close
     * @param {number} volume
     * @returns {number | undefined}
     */
    next(timestamp, open, high, low, close, volume) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.anchoredvwapstream_next(retptr, this.__wbg_ptr, timestamp, open, high, low, close, volume);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r2 = getDataViewMemory0().getFloat64(retptr + 8 * 1, true);
            return r0 === 0 ? undefined : r2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Reset the calculator to initial state.
     */
    reset() {
        wasm.anchoredvwapstream_reset(this.__wbg_ptr);
    }
    /**
     * Get current VWAP value without consuming a new candle.
     * @returns {number | undefined}
     */
    current() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.anchoredvwapstream_current(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r2 = getDataViewMemory0().getFloat64(retptr + 8 * 1, true);
            return r0 === 0 ? undefined : r2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Check if calculator has been anchored and is producing values.
     * @returns {boolean}
     */
    isReady() {
        const ret = wasm.anchoredvwapstream_isReady(this.__wbg_ptr);
        return ret !== 0;
    }
}
if (Symbol.dispose) AnchoredVwapStream.prototype[Symbol.dispose] = AnchoredVwapStream.prototype.free;
exports.AnchoredVwapStream = AnchoredVwapStream;

/**
 * Streaming ATR calculator for real-time O(1) updates.
 */
class AtrStream {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AtrStreamFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_atrstream_free(ptr, 0);
    }
    /**
     * Initialize with historical OHLC data.
     * Takes three arrays: highs, lows, closes.
     * Returns array of ATR values.
     * @param {Float64Array} highs
     * @param {Float64Array} lows
     * @param {Float64Array} closes
     * @returns {Float64Array}
     */
    init(highs, lows, closes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArrayF64ToWasm0(highs, wasm.__wbindgen_export3);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passArrayF64ToWasm0(lows, wasm.__wbindgen_export3);
            const len1 = WASM_VECTOR_LEN;
            const ptr2 = passArrayF64ToWasm0(closes, wasm.__wbindgen_export3);
            const len2 = WASM_VECTOR_LEN;
            wasm.atrstream_init(retptr, this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v4 = getArrayF64FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export(r0, r1 * 8, 8);
            return v4;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a new streaming ATR calculator.
     * @param {number} period
     */
    constructor(period) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.atrstream_new(retptr, period);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            this.__wbg_ptr = r0 >>> 0;
            AtrStreamFinalization.register(this, this.__wbg_ptr, this);
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Process next bar. Takes high, low, close.
     * Returns ATR or NaN if not ready.
     * @param {number} high
     * @param {number} low
     * @param {number} close
     * @returns {number}
     */
    next(high, low, close) {
        const ret = wasm.atrstream_next(this.__wbg_ptr, high, low, close);
        return ret;
    }
    /**
     * Reset the calculator to initial state.
     */
    reset() {
        wasm.atrstream_reset(this.__wbg_ptr);
    }
    /**
     * Get the period.
     * @returns {number}
     */
    get period() {
        const ret = wasm.atrstream_period(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Get current ATR value without consuming a new bar.
     * @returns {number}
     */
    current() {
        const ret = wasm.atrstream_current(this.__wbg_ptr);
        return ret;
    }
    /**
     * Check if calculator has enough data to produce values.
     * @returns {boolean}
     */
    isReady() {
        const ret = wasm.atrstream_isReady(this.__wbg_ptr);
        return ret !== 0;
    }
}
if (Symbol.dispose) AtrStream.prototype[Symbol.dispose] = AtrStream.prototype.free;
exports.AtrStream = AtrStream;

/**
 * Streaming Bollinger Bands calculator for real-time O(1) updates.
 */
class BBandsStream {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BBandsStreamFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_bbandsstream_free(ptr, 0);
    }
    /**
     * Initialize with historical data. Returns object with arrays.
     * @param {Float64Array} data
     * @returns {any}
     */
    init(data) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_export3);
            const len0 = WASM_VECTOR_LEN;
            wasm.bbandsstream_init(retptr, this.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the K multiplier.
     * @returns {number}
     */
    get k() {
        const ret = wasm.bbandsstream_k(this.__wbg_ptr);
        return ret;
    }
    /**
     * Create a new streaming Bollinger Bands calculator.
     * @param {number} period
     * @param {number} k
     */
    constructor(period, k) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.bbandsstream_new(retptr, period, k);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            this.__wbg_ptr = r0 >>> 0;
            BBandsStreamFinalization.register(this, this.__wbg_ptr, this);
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Process next value. Returns BBands output or undefined if not ready.
     * @param {number} value
     * @returns {WasmBBandsOutput | undefined}
     */
    next(value) {
        const ret = wasm.bbandsstream_next(this.__wbg_ptr, value);
        return ret === 0 ? undefined : WasmBBandsOutput.__wrap(ret);
    }
    /**
     * Reset the calculator to initial state.
     */
    reset() {
        wasm.bbandsstream_reset(this.__wbg_ptr);
    }
    /**
     * Get the period.
     * @returns {number}
     */
    get period() {
        const ret = wasm.bbandsstream_period(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Check if calculator has enough data to produce values.
     * @returns {boolean}
     */
    isReady() {
        const ret = wasm.bbandsstream_isReady(this.__wbg_ptr);
        return ret !== 0;
    }
}
if (Symbol.dispose) BBandsStream.prototype[Symbol.dispose] = BBandsStream.prototype.free;
exports.BBandsStream = BBandsStream;

/**
 * Streaming CVD calculator for OHLCV data.
 */
class CvdOhlcvStream {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        CvdOhlcvStreamFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_cvdohlcvstream_free(ptr, 0);
    }
    /**
     * Initialize with historical OHLCV data.
     * Takes four arrays: highs, lows, closes, volumes.
     * Returns array of CVD values.
     * @param {Float64Array} highs
     * @param {Float64Array} lows
     * @param {Float64Array} closes
     * @param {Float64Array} volumes
     * @returns {Float64Array}
     */
    init(highs, lows, closes, volumes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArrayF64ToWasm0(highs, wasm.__wbindgen_export3);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passArrayF64ToWasm0(lows, wasm.__wbindgen_export3);
            const len1 = WASM_VECTOR_LEN;
            const ptr2 = passArrayF64ToWasm0(closes, wasm.__wbindgen_export3);
            const len2 = WASM_VECTOR_LEN;
            const ptr3 = passArrayF64ToWasm0(volumes, wasm.__wbindgen_export3);
            const len3 = WASM_VECTOR_LEN;
            wasm.cvdohlcvstream_init(retptr, this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v5 = getArrayF64FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export(r0, r1 * 8, 8);
            return v5;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a new streaming CVD calculator for OHLCV data.
     */
    constructor() {
        const ret = wasm.cvdohlcvstream_new();
        this.__wbg_ptr = ret >>> 0;
        CvdOhlcvStreamFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Process next bar. Takes high, low, close, volume.
     * Returns CVD value or undefined if not ready.
     * @param {number} high
     * @param {number} low
     * @param {number} close
     * @param {number} volume
     * @returns {number | undefined}
     */
    next(high, low, close, volume) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.cvdohlcvstream_next(retptr, this.__wbg_ptr, high, low, close, volume);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r2 = getDataViewMemory0().getFloat64(retptr + 8 * 1, true);
            return r0 === 0 ? undefined : r2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Reset the calculator to initial state.
     */
    reset() {
        wasm.cvdohlcvstream_reset(this.__wbg_ptr);
    }
    /**
     * Get current CVD value without consuming a new bar.
     * @returns {number | undefined}
     */
    current() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.cvdohlcvstream_current(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r2 = getDataViewMemory0().getFloat64(retptr + 8 * 1, true);
            return r0 === 0 ? undefined : r2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Check if calculator has enough data to produce values.
     * @returns {boolean}
     */
    isReady() {
        const ret = wasm.cvdohlcvstream_isReady(this.__wbg_ptr);
        return ret !== 0;
    }
}
if (Symbol.dispose) CvdOhlcvStream.prototype[Symbol.dispose] = CvdOhlcvStream.prototype.free;
exports.CvdOhlcvStream = CvdOhlcvStream;

/**
 * Streaming CVD calculator for pre-computed delta values.
 */
class CvdStream {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        CvdStreamFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_cvdstream_free(ptr, 0);
    }
    /**
     * Initialize with historical delta values.
     * Returns array of CVD values.
     * @param {Float64Array} deltas
     * @returns {Float64Array}
     */
    init(deltas) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArrayF64ToWasm0(deltas, wasm.__wbindgen_export3);
            const len0 = WASM_VECTOR_LEN;
            wasm.cvdstream_init(retptr, this.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v2 = getArrayF64FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export(r0, r1 * 8, 8);
            return v2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a new streaming CVD calculator.
     */
    constructor() {
        const ret = wasm.cvdohlcvstream_new();
        this.__wbg_ptr = ret >>> 0;
        CvdStreamFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Process next delta value. Returns CVD value or undefined if NaN input.
     * @param {number} delta
     * @returns {number | undefined}
     */
    next(delta) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.cvdstream_next(retptr, this.__wbg_ptr, delta);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r2 = getDataViewMemory0().getFloat64(retptr + 8 * 1, true);
            return r0 === 0 ? undefined : r2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Reset the calculator to initial state.
     */
    reset() {
        wasm.cvdohlcvstream_reset(this.__wbg_ptr);
    }
    /**
     * Get current CVD value without consuming a new delta.
     * @returns {number | undefined}
     */
    current() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.cvdohlcvstream_current(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r2 = getDataViewMemory0().getFloat64(retptr + 8 * 1, true);
            return r0 === 0 ? undefined : r2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Check if calculator has enough data to produce values.
     * @returns {boolean}
     */
    isReady() {
        const ret = wasm.cvdohlcvstream_isReady(this.__wbg_ptr);
        return ret !== 0;
    }
}
if (Symbol.dispose) CvdStream.prototype[Symbol.dispose] = CvdStream.prototype.free;
exports.CvdStream = CvdStream;

/**
 * Streaming EMA calculator for real-time O(1) updates.
 */
class EmaStream {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        EmaStreamFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_emastream_free(ptr, 0);
    }
    /**
     * Get the smoothing multiplier.
     * @returns {number}
     */
    get multiplier() {
        const ret = wasm.bbandsstream_k(this.__wbg_ptr);
        return ret;
    }
    /**
     * Initialize with historical data. Returns array of EMA values.
     * @param {Float64Array} data
     * @returns {Float64Array}
     */
    init(data) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_export3);
            const len0 = WASM_VECTOR_LEN;
            wasm.emastream_init(retptr, this.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v2 = getArrayF64FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export(r0, r1 * 8, 8);
            return v2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a new streaming EMA calculator.
     * @param {number} period
     */
    constructor(period) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.emastream_new(retptr, period);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            this.__wbg_ptr = r0 >>> 0;
            EmaStreamFinalization.register(this, this.__wbg_ptr, this);
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Process next value. Returns EMA or NaN if not ready.
     * @param {number} value
     * @returns {number}
     */
    next(value) {
        const ret = wasm.emastream_next(this.__wbg_ptr, value);
        return ret;
    }
    /**
     * Reset the calculator to initial state.
     */
    reset() {
        wasm.emastream_reset(this.__wbg_ptr);
    }
    /**
     * Get the period.
     * @returns {number}
     */
    get period() {
        const ret = wasm.bbandsstream_period(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Get current EMA value without consuming a new value.
     * @returns {number}
     */
    current() {
        const ret = wasm.emastream_current(this.__wbg_ptr);
        return ret;
    }
    /**
     * Check if calculator has enough data to produce values.
     * @returns {boolean}
     */
    isReady() {
        const ret = wasm.emastream_isReady(this.__wbg_ptr);
        return ret !== 0;
    }
}
if (Symbol.dispose) EmaStream.prototype[Symbol.dispose] = EmaStream.prototype.free;
exports.EmaStream = EmaStream;

/**
 * FRVP output returned to JavaScript.
 */
class FrvpOutput {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(FrvpOutput.prototype);
        obj.__wbg_ptr = ptr;
        FrvpOutputFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FrvpOutputFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_frvpoutput_free(ptr, 0);
    }
    /**
     * Volume at POC
     * @returns {number}
     */
    get pocVolume() {
        const ret = wasm.frvpoutput_pocVolume(this.__wbg_ptr);
        return ret;
    }
    /**
     * Highest price in the range
     * @returns {number}
     */
    get rangeHigh() {
        const ret = wasm.frvpoutput_rangeHigh(this.__wbg_ptr);
        return ret;
    }
    /**
     * Total volume in the range
     * @returns {number}
     */
    get totalVolume() {
        const ret = wasm.anchoredvwapstream_cumulativeVolume(this.__wbg_ptr);
        return ret;
    }
    /**
     * Volume within the Value Area
     * @returns {number}
     */
    get valueAreaVolume() {
        const ret = wasm.frvpoutput_valueAreaVolume(this.__wbg_ptr);
        return ret;
    }
    /**
     * Point of Control - price level with highest volume
     * @returns {number}
     */
    get poc() {
        const ret = wasm.bbandsstream_k(this.__wbg_ptr);
        return ret;
    }
    /**
     * Value Area High - upper boundary of value area
     * @returns {number}
     */
    get vah() {
        const ret = wasm.frvpoutput_vah(this.__wbg_ptr);
        return ret;
    }
    /**
     * Value Area Low - lower boundary of value area
     * @returns {number}
     */
    get val() {
        const ret = wasm.anchoredvwapstream_cumulativeTpVolume(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get histogram as a JavaScript object with arrays
     * @returns {any}
     */
    get histogram() {
        const ret = wasm.frvpoutput_histogram(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Lowest price in the range
     * @returns {number}
     */
    get rangeLow() {
        const ret = wasm.frvpoutput_rangeLow(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) FrvpOutput.prototype[Symbol.dispose] = FrvpOutput.prototype.free;
exports.FrvpOutput = FrvpOutput;

/**
 * Streaming FRVP calculator for real-time updates.
 */
class FrvpStream {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FrvpStreamFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_frvpstream_free(ptr, 0);
    }
    /**
     * Get the number of candles in the buffer.
     * @returns {number}
     */
    get candleCount() {
        const ret = wasm.frvpstream_candleCount(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Initialize with historical OHLCV data.
     *
     * @param highs - Array of high prices
     * @param lows - Array of low prices
     * @param closes - Array of close prices
     * @param volumes - Array of volumes
     * @returns FRVP output for the entire range
     * @param {Float64Array} highs
     * @param {Float64Array} lows
     * @param {Float64Array} closes
     * @param {Float64Array} volumes
     * @returns {FrvpOutput | undefined}
     */
    init(highs, lows, closes, volumes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArrayF64ToWasm0(highs, wasm.__wbindgen_export3);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passArrayF64ToWasm0(lows, wasm.__wbindgen_export3);
            const len1 = WASM_VECTOR_LEN;
            const ptr2 = passArrayF64ToWasm0(closes, wasm.__wbindgen_export3);
            const len2 = WASM_VECTOR_LEN;
            const ptr3 = passArrayF64ToWasm0(volumes, wasm.__wbindgen_export3);
            const len3 = WASM_VECTOR_LEN;
            wasm.frvpstream_init(retptr, this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return r0 === 0 ? undefined : FrvpOutput.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a new streaming FRVP calculator.
     *
     * @param numBins - Number of price bins (rows) in histogram
     * @param valueAreaPercent - Optional percentage of volume for value area (0.0-1.0, default 0.70)
     * @param {number} num_bins
     * @param {number | null} [value_area_percent]
     */
    constructor(num_bins, value_area_percent) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.frvpstream_new(retptr, num_bins, !isLikeNone(value_area_percent), isLikeNone(value_area_percent) ? 0 : value_area_percent);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            this.__wbg_ptr = r0 >>> 0;
            FrvpStreamFinalization.register(this, this.__wbg_ptr, this);
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Process next candle.
     *
     * @param high - High price
     * @param low - Low price
     * @param close - Close price
     * @param volume - Volume
     * @returns Updated FRVP output or undefined if not ready
     * @param {number} high
     * @param {number} low
     * @param {number} close
     * @param {number} volume
     * @returns {FrvpOutput | undefined}
     */
    next(high, low, close, volume) {
        const ret = wasm.frvpstream_next(this.__wbg_ptr, high, low, close, volume);
        return ret === 0 ? undefined : FrvpOutput.__wrap(ret);
    }
    /**
     * Clear all candles from the buffer.
     */
    clear() {
        wasm.frvpstream_clear(this.__wbg_ptr);
    }
    /**
     * Reset the calculator and clear all candles.
     */
    reset() {
        wasm.frvpstream_clear(this.__wbg_ptr);
    }
    /**
     * Check if calculator has been initialized with data.
     * @returns {boolean}
     */
    isReady() {
        const ret = wasm.frvpstream_isReady(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Get the number of price bins.
     * @returns {number}
     */
    get numBins() {
        const ret = wasm.frvpstream_numBins(this.__wbg_ptr);
        return ret >>> 0;
    }
}
if (Symbol.dispose) FrvpStream.prototype[Symbol.dispose] = FrvpStream.prototype.free;
exports.FrvpStream = FrvpStream;

/**
 * Streaming HMA calculator for real-time updates.
 */
class HmaStream {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        HmaStreamFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_hmastream_free(ptr, 0);
    }
    /**
     * Get the half period.
     * @returns {number}
     */
    get halfPeriod() {
        const ret = wasm.hmastream_halfPeriod(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Get the sqrt period.
     * @returns {number}
     */
    get sqrtPeriod() {
        const ret = wasm.hmastream_sqrtPeriod(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Initialize with historical data.
     * @param {Float64Array} data
     * @returns {Float64Array}
     */
    init(data) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_export3);
            const len0 = WASM_VECTOR_LEN;
            wasm.hmastream_init(retptr, this.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v2 = getArrayF64FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export(r0, r1 * 8, 8);
            return v2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a new streaming HMA calculator.
     * @param {number} period
     */
    constructor(period) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.hmastream_new(retptr, period);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            this.__wbg_ptr = r0 >>> 0;
            HmaStreamFinalization.register(this, this.__wbg_ptr, this);
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Process next value.
     * @param {number} value
     * @returns {number | undefined}
     */
    next(value) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.hmastream_next(retptr, this.__wbg_ptr, value);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r2 = getDataViewMemory0().getFloat64(retptr + 8 * 1, true);
            return r0 === 0 ? undefined : r2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Reset the calculator.
     */
    reset() {
        wasm.hmastream_reset(this.__wbg_ptr);
    }
    /**
     * Get the period.
     * @returns {number}
     */
    get period() {
        const ret = wasm.hmastream_period(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Check if ready.
     * @returns {boolean}
     */
    isReady() {
        const ret = wasm.hmastream_isReady(this.__wbg_ptr);
        return ret !== 0;
    }
}
if (Symbol.dispose) HmaStream.prototype[Symbol.dispose] = HmaStream.prototype.free;
exports.HmaStream = HmaStream;

/**
 * Streaming Ichimoku Cloud calculator.
 */
class IchimokuStream {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        IchimokuStreamFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_ichimokustream_free(ptr, 0);
    }
    /**
     * Initialize with historical data.
     * @param {Float64Array} highs
     * @param {Float64Array} lows
     * @param {Float64Array} closes
     * @returns {any}
     */
    init(highs, lows, closes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArrayF64ToWasm0(highs, wasm.__wbindgen_export3);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passArrayF64ToWasm0(lows, wasm.__wbindgen_export3);
            const len1 = WASM_VECTOR_LEN;
            const ptr2 = passArrayF64ToWasm0(closes, wasm.__wbindgen_export3);
            const len2 = WASM_VECTOR_LEN;
            wasm.ichimokustream_init(retptr, this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the Kijun-sen period.
     * @returns {number}
     */
    get kijunPeriod() {
        const ret = wasm.ichimokustream_kijunPeriod(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Get the Tenkan-sen period.
     * @returns {number}
     */
    get tenkanPeriod() {
        const ret = wasm.ichimokustream_tenkanPeriod(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Get the Senkou Span B period.
     * @returns {number}
     */
    get senkouBPeriod() {
        const ret = wasm.ichimokustream_senkouBPeriod(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Create a new streaming Ichimoku calculator with default periods (9, 26, 52).
     * @param {number | null} [tenkan_period]
     * @param {number | null} [kijun_period]
     * @param {number | null} [senkou_b_period]
     */
    constructor(tenkan_period, kijun_period, senkou_b_period) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.ichimokustream_new(retptr, isLikeNone(tenkan_period) ? 0x100000001 : (tenkan_period) >>> 0, isLikeNone(kijun_period) ? 0x100000001 : (kijun_period) >>> 0, isLikeNone(senkou_b_period) ? 0x100000001 : (senkou_b_period) >>> 0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            this.__wbg_ptr = r0 >>> 0;
            IchimokuStreamFinalization.register(this, this.__wbg_ptr, this);
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Process next bar.
     * @param {number} high
     * @param {number} low
     * @param {number} close
     * @returns {WasmIchimokuOutput | undefined}
     */
    next(high, low, close) {
        const ret = wasm.ichimokustream_next(this.__wbg_ptr, high, low, close);
        return ret === 0 ? undefined : WasmIchimokuOutput.__wrap(ret);
    }
    /**
     * Reset the calculator.
     */
    reset() {
        wasm.ichimokustream_reset(this.__wbg_ptr);
    }
    /**
     * Check if ready.
     * @returns {boolean}
     */
    isReady() {
        const ret = wasm.ichimokustream_isReady(this.__wbg_ptr);
        return ret !== 0;
    }
}
if (Symbol.dispose) IchimokuStream.prototype[Symbol.dispose] = IchimokuStream.prototype.free;
exports.IchimokuStream = IchimokuStream;

/**
 * Streaming Linear Regression calculator.
 */
class LinRegStream {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LinRegStreamFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_linregstream_free(ptr, 0);
    }
    /**
     * Get the number of standard deviations.
     * @returns {number}
     */
    get numStdDev() {
        const ret = wasm.bbandsstream_k(this.__wbg_ptr);
        return ret;
    }
    /**
     * Initialize with historical data.
     * @param {Float64Array} data
     * @returns {any}
     */
    init(data) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_export3);
            const len0 = WASM_VECTOR_LEN;
            wasm.linregstream_init(retptr, this.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a new streaming Linear Regression calculator.
     * @param {number} period
     * @param {number | null} [num_std_dev]
     */
    constructor(period, num_std_dev) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.linregstream_new(retptr, period, !isLikeNone(num_std_dev), isLikeNone(num_std_dev) ? 0 : num_std_dev);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            this.__wbg_ptr = r0 >>> 0;
            LinRegStreamFinalization.register(this, this.__wbg_ptr, this);
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Process next value.
     * @param {number} value
     * @returns {WasmLinRegOutput | undefined}
     */
    next(value) {
        const ret = wasm.linregstream_next(this.__wbg_ptr, value);
        return ret === 0 ? undefined : WasmLinRegOutput.__wrap(ret);
    }
    /**
     * Reset the calculator.
     */
    reset() {
        wasm.linregstream_reset(this.__wbg_ptr);
    }
    /**
     * Get the period.
     * @returns {number}
     */
    get period() {
        const ret = wasm.frvpstream_numBins(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Check if ready.
     * @returns {boolean}
     */
    isReady() {
        const ret = wasm.linregstream_isReady(this.__wbg_ptr);
        return ret !== 0;
    }
}
if (Symbol.dispose) LinRegStream.prototype[Symbol.dispose] = LinRegStream.prototype.free;
exports.LinRegStream = LinRegStream;

/**
 * Streaming MACD calculator for real-time O(1) updates.
 */
class MacdStream {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        MacdStreamFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_macdstream_free(ptr, 0);
    }
    /**
     * Get the fast period.
     * @returns {number}
     */
    get fastPeriod() {
        const ret = wasm.macdstream_fastPeriod(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Get the slow period.
     * @returns {number}
     */
    get slowPeriod() {
        const ret = wasm.hmastream_halfPeriod(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Initialize with historical data. Returns array of MACD outputs as JS object.
     * @param {Float64Array} data
     * @returns {any}
     */
    init(data) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_export3);
            const len0 = WASM_VECTOR_LEN;
            wasm.macdstream_init(retptr, this.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the signal period.
     * @returns {number}
     */
    get signalPeriod() {
        const ret = wasm.hmastream_sqrtPeriod(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Create a new streaming MACD calculator.
     * @param {number} fast_period
     * @param {number} slow_period
     * @param {number} signal_period
     */
    constructor(fast_period, slow_period, signal_period) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.macdstream_new(retptr, fast_period, slow_period, signal_period);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            this.__wbg_ptr = r0 >>> 0;
            MacdStreamFinalization.register(this, this.__wbg_ptr, this);
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Process next value. Returns MACD output or undefined if not ready.
     * @param {number} value
     * @returns {WasmMacdOutput | undefined}
     */
    next(value) {
        const ret = wasm.macdstream_next(this.__wbg_ptr, value);
        return ret === 0 ? undefined : WasmMacdOutput.__wrap(ret);
    }
    /**
     * Reset the calculator to initial state.
     */
    reset() {
        wasm.macdstream_reset(this.__wbg_ptr);
    }
    /**
     * Check if calculator has enough data to produce values.
     * @returns {boolean}
     */
    isReady() {
        const ret = wasm.macdstream_isReady(this.__wbg_ptr);
        return ret !== 0;
    }
}
if (Symbol.dispose) MacdStream.prototype[Symbol.dispose] = MacdStream.prototype.free;
exports.MacdStream = MacdStream;

/**
 * Streaming MFI calculator for real-time O(1) updates.
 */
class MfiStream {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        MfiStreamFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_mfistream_free(ptr, 0);
    }
    /**
     * Initialize with historical OHLCV data.
     * @param {Float64Array} highs
     * @param {Float64Array} lows
     * @param {Float64Array} closes
     * @param {Float64Array} volumes
     * @returns {Float64Array}
     */
    init(highs, lows, closes, volumes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArrayF64ToWasm0(highs, wasm.__wbindgen_export3);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passArrayF64ToWasm0(lows, wasm.__wbindgen_export3);
            const len1 = WASM_VECTOR_LEN;
            const ptr2 = passArrayF64ToWasm0(closes, wasm.__wbindgen_export3);
            const len2 = WASM_VECTOR_LEN;
            const ptr3 = passArrayF64ToWasm0(volumes, wasm.__wbindgen_export3);
            const len3 = WASM_VECTOR_LEN;
            wasm.mfistream_init(retptr, this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v5 = getArrayF64FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export(r0, r1 * 8, 8);
            return v5;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a new streaming MFI calculator.
     * @param {number} period
     */
    constructor(period) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.mfistream_new(retptr, period);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            this.__wbg_ptr = r0 >>> 0;
            MfiStreamFinalization.register(this, this.__wbg_ptr, this);
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Process next bar.
     * @param {number} high
     * @param {number} low
     * @param {number} close
     * @param {number} volume
     * @returns {number | undefined}
     */
    next(high, low, close, volume) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.mfistream_next(retptr, this.__wbg_ptr, high, low, close, volume);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r2 = getDataViewMemory0().getFloat64(retptr + 8 * 1, true);
            return r0 === 0 ? undefined : r2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Reset the calculator.
     */
    reset() {
        wasm.mfistream_reset(this.__wbg_ptr);
    }
    /**
     * Get the period.
     * @returns {number}
     */
    get period() {
        const ret = wasm.mfistream_period(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Get current MFI value.
     * @returns {number | undefined}
     */
    current() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.mfistream_current(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r2 = getDataViewMemory0().getFloat64(retptr + 8 * 1, true);
            return r0 === 0 ? undefined : r2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Check if ready.
     * @returns {boolean}
     */
    isReady() {
        const ret = wasm.mfistream_isReady(this.__wbg_ptr);
        return ret !== 0;
    }
}
if (Symbol.dispose) MfiStream.prototype[Symbol.dispose] = MfiStream.prototype.free;
exports.MfiStream = MfiStream;

/**
 * Streaming Rolling VWAP calculator with sliding window.
 */
class RollingVwapStream {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        RollingVwapStreamFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_rollingvwapstream_free(ptr, 0);
    }
    /**
     * Initialize with historical OHLCV data.
     * Returns array of VWAP values.
     * @param {Float64Array} timestamps
     * @param {Float64Array} opens
     * @param {Float64Array} highs
     * @param {Float64Array} lows
     * @param {Float64Array} closes
     * @param {Float64Array} volumes
     * @returns {Float64Array}
     */
    init(timestamps, opens, highs, lows, closes, volumes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArrayF64ToWasm0(timestamps, wasm.__wbindgen_export3);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passArrayF64ToWasm0(opens, wasm.__wbindgen_export3);
            const len1 = WASM_VECTOR_LEN;
            const ptr2 = passArrayF64ToWasm0(highs, wasm.__wbindgen_export3);
            const len2 = WASM_VECTOR_LEN;
            const ptr3 = passArrayF64ToWasm0(lows, wasm.__wbindgen_export3);
            const len3 = WASM_VECTOR_LEN;
            const ptr4 = passArrayF64ToWasm0(closes, wasm.__wbindgen_export3);
            const len4 = WASM_VECTOR_LEN;
            const ptr5 = passArrayF64ToWasm0(volumes, wasm.__wbindgen_export3);
            const len5 = WASM_VECTOR_LEN;
            wasm.rollingvwapstream_init(retptr, this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, ptr5, len5);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v7 = getArrayF64FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export(r0, r1 * 8, 8);
            return v7;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a new streaming Rolling VWAP calculator.
     * @param {number} period
     */
    constructor(period) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.rollingvwapstream_new(retptr, period);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            this.__wbg_ptr = r0 >>> 0;
            RollingVwapStreamFinalization.register(this, this.__wbg_ptr, this);
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Process next candle. Returns VWAP value or NaN if not ready.
     * @param {number} timestamp
     * @param {number} open
     * @param {number} high
     * @param {number} low
     * @param {number} close
     * @param {number} volume
     * @returns {number}
     */
    next(timestamp, open, high, low, close, volume) {
        const ret = wasm.rollingvwapstream_next(this.__wbg_ptr, timestamp, open, high, low, close, volume);
        return ret;
    }
    /**
     * Reset the calculator to initial state.
     */
    reset() {
        wasm.rollingvwapstream_reset(this.__wbg_ptr);
    }
    /**
     * Get the period.
     * @returns {number}
     */
    get period() {
        const ret = wasm.rollingvwapstream_period(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Get current VWAP value without consuming a new candle.
     * @returns {number}
     */
    current() {
        const ret = wasm.rollingvwapstream_current(this.__wbg_ptr);
        return ret;
    }
    /**
     * Check if calculator has enough data to produce values.
     * @returns {boolean}
     */
    isReady() {
        const ret = wasm.rollingvwapstream_isReady(this.__wbg_ptr);
        return ret !== 0;
    }
}
if (Symbol.dispose) RollingVwapStream.prototype[Symbol.dispose] = RollingVwapStream.prototype.free;
exports.RollingVwapStream = RollingVwapStream;

/**
 * Streaming RSI calculator for real-time O(1) updates.
 */
class RsiStream {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        RsiStreamFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_rsistream_free(ptr, 0);
    }
    /**
     * Initialize with historical data. Returns array of RSI values.
     * @param {Float64Array} data
     * @returns {Float64Array}
     */
    init(data) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_export3);
            const len0 = WASM_VECTOR_LEN;
            wasm.rsistream_init(retptr, this.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v2 = getArrayF64FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export(r0, r1 * 8, 8);
            return v2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a new streaming RSI calculator.
     * @param {number} period
     */
    constructor(period) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.rsistream_new(retptr, period);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            this.__wbg_ptr = r0 >>> 0;
            RsiStreamFinalization.register(this, this.__wbg_ptr, this);
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Process next value. Returns RSI or NaN if not ready.
     * @param {number} value
     * @returns {number}
     */
    next(value) {
        const ret = wasm.rsistream_next(this.__wbg_ptr, value);
        return ret;
    }
    /**
     * Reset the calculator to initial state.
     */
    reset() {
        wasm.rsistream_reset(this.__wbg_ptr);
    }
    /**
     * Get the period.
     * @returns {number}
     */
    get period() {
        const ret = wasm.rsistream_period(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Get current RSI value without consuming a new value.
     * @returns {number}
     */
    current() {
        const ret = wasm.rsistream_current(this.__wbg_ptr);
        return ret;
    }
    /**
     * Check if calculator has enough data to produce values.
     * @returns {boolean}
     */
    isReady() {
        const ret = wasm.rsistream_isReady(this.__wbg_ptr);
        return ret !== 0;
    }
}
if (Symbol.dispose) RsiStream.prototype[Symbol.dispose] = RsiStream.prototype.free;
exports.RsiStream = RsiStream;

/**
 * Streaming Session VWAP calculator (resets daily at UTC midnight).
 */
class SessionVwapStream {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SessionVwapStreamFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_sessionvwapstream_free(ptr, 0);
    }
    /**
     * Initialize with historical OHLCV data.
     * Returns array of VWAP values.
     * @param {Float64Array} timestamps
     * @param {Float64Array} opens
     * @param {Float64Array} highs
     * @param {Float64Array} lows
     * @param {Float64Array} closes
     * @param {Float64Array} volumes
     * @returns {Float64Array}
     */
    init(timestamps, opens, highs, lows, closes, volumes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArrayF64ToWasm0(timestamps, wasm.__wbindgen_export3);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passArrayF64ToWasm0(opens, wasm.__wbindgen_export3);
            const len1 = WASM_VECTOR_LEN;
            const ptr2 = passArrayF64ToWasm0(highs, wasm.__wbindgen_export3);
            const len2 = WASM_VECTOR_LEN;
            const ptr3 = passArrayF64ToWasm0(lows, wasm.__wbindgen_export3);
            const len3 = WASM_VECTOR_LEN;
            const ptr4 = passArrayF64ToWasm0(closes, wasm.__wbindgen_export3);
            const len4 = WASM_VECTOR_LEN;
            const ptr5 = passArrayF64ToWasm0(volumes, wasm.__wbindgen_export3);
            const len5 = WASM_VECTOR_LEN;
            wasm.sessionvwapstream_init(retptr, this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, ptr5, len5);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v7 = getArrayF64FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export(r0, r1 * 8, 8);
            return v7;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get cumulative volume.
     * @returns {number}
     */
    cumulativeVolume() {
        const ret = wasm.frvpoutput_vah(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get cumulative typical price × volume.
     * @returns {number}
     */
    cumulativeTpVolume() {
        const ret = wasm.bbandsstream_k(this.__wbg_ptr);
        return ret;
    }
    /**
     * Create a new streaming Session VWAP calculator.
     */
    constructor() {
        const ret = wasm.sessionvwapstream_new();
        this.__wbg_ptr = ret >>> 0;
        SessionVwapStreamFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Process next candle. Returns VWAP value.
     * @param {number} timestamp
     * @param {number} open
     * @param {number} high
     * @param {number} low
     * @param {number} close
     * @param {number} volume
     * @returns {number | undefined}
     */
    next(timestamp, open, high, low, close, volume) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.sessionvwapstream_next(retptr, this.__wbg_ptr, timestamp, open, high, low, close, volume);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r2 = getDataViewMemory0().getFloat64(retptr + 8 * 1, true);
            return r0 === 0 ? undefined : r2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Reset the calculator to initial state.
     */
    reset() {
        wasm.sessionvwapstream_reset(this.__wbg_ptr);
    }
    /**
     * Get current VWAP value without consuming a new candle.
     * @returns {number | undefined}
     */
    current() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.sessionvwapstream_current(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r2 = getDataViewMemory0().getFloat64(retptr + 8 * 1, true);
            return r0 === 0 ? undefined : r2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Check if calculator has enough data to produce values.
     * @returns {boolean}
     */
    isReady() {
        const ret = wasm.sessionvwapstream_isReady(this.__wbg_ptr);
        return ret !== 0;
    }
}
if (Symbol.dispose) SessionVwapStream.prototype[Symbol.dispose] = SessionVwapStream.prototype.free;
exports.SessionVwapStream = SessionVwapStream;

/**
 * Streaming SMA calculator for real-time O(1) updates.
 */
class SmaStream {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SmaStreamFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_smastream_free(ptr, 0);
    }
    /**
     * Initialize with historical data. Returns array of SMA values.
     * @param {Float64Array} data
     * @returns {Float64Array}
     */
    init(data) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_export3);
            const len0 = WASM_VECTOR_LEN;
            wasm.smastream_init(retptr, this.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v2 = getArrayF64FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export(r0, r1 * 8, 8);
            return v2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a new streaming SMA calculator.
     * @param {number} period
     */
    constructor(period) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.smastream_new(retptr, period);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            this.__wbg_ptr = r0 >>> 0;
            SmaStreamFinalization.register(this, this.__wbg_ptr, this);
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Process next value. Returns SMA or NaN if not ready.
     * @param {number} value
     * @returns {number}
     */
    next(value) {
        const ret = wasm.smastream_next(this.__wbg_ptr, value);
        return ret;
    }
    /**
     * Reset the calculator to initial state.
     */
    reset() {
        wasm.smastream_reset(this.__wbg_ptr);
    }
    /**
     * Get the period.
     * @returns {number}
     */
    get period() {
        const ret = wasm.frvpstream_numBins(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Check if calculator has enough data to produce values.
     * @returns {boolean}
     */
    isReady() {
        const ret = wasm.linregstream_isReady(this.__wbg_ptr);
        return ret !== 0;
    }
}
if (Symbol.dispose) SmaStream.prototype[Symbol.dispose] = SmaStream.prototype.free;
exports.SmaStream = SmaStream;

/**
 * Streaming Fast Stochastic calculator for real-time O(1) updates.
 */
class StochFastStream {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        StochFastStreamFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_stochfaststream_free(ptr, 0);
    }
    /**
     * Initialize with historical data. Takes parallel arrays of highs, lows, closes.
     * Returns array of Stochastic outputs as JS object with k and d arrays.
     * @param {Float64Array} highs
     * @param {Float64Array} lows
     * @param {Float64Array} closes
     * @returns {any}
     */
    init(highs, lows, closes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArrayF64ToWasm0(highs, wasm.__wbindgen_export3);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passArrayF64ToWasm0(lows, wasm.__wbindgen_export3);
            const len1 = WASM_VECTOR_LEN;
            const ptr2 = passArrayF64ToWasm0(closes, wasm.__wbindgen_export3);
            const len2 = WASM_VECTOR_LEN;
            wasm.stochfaststream_init(retptr, this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a new streaming Fast Stochastic calculator.
     * @param {number} k_period
     * @param {number} d_period
     */
    constructor(k_period, d_period) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.stochfaststream_new(retptr, k_period, d_period);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            this.__wbg_ptr = r0 >>> 0;
            StochFastStreamFinalization.register(this, this.__wbg_ptr, this);
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Process next bar. Takes high, low, close.
     * Returns Stochastic output or undefined if not ready.
     * @param {number} high
     * @param {number} low
     * @param {number} close
     * @returns {WasmStochOutput | undefined}
     */
    next(high, low, close) {
        const ret = wasm.stochfaststream_next(this.__wbg_ptr, high, low, close);
        return ret === 0 ? undefined : WasmStochOutput.__wrap(ret);
    }
    /**
     * Reset the calculator to initial state.
     */
    reset() {
        wasm.stochfaststream_reset(this.__wbg_ptr);
    }
    /**
     * Get the D period.
     * @returns {number}
     */
    get dPeriod() {
        const ret = wasm.stochfaststream_dPeriod(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Check if calculator has enough data to produce values.
     * @returns {boolean}
     */
    isReady() {
        const ret = wasm.stochfaststream_isReady(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Get the K period.
     * @returns {number}
     */
    get kPeriod() {
        const ret = wasm.stochfaststream_kPeriod(this.__wbg_ptr);
        return ret >>> 0;
    }
}
if (Symbol.dispose) StochFastStream.prototype[Symbol.dispose] = StochFastStream.prototype.free;
exports.StochFastStream = StochFastStream;

/**
 * Streaming Stochastic RSI calculator for real-time O(1) updates.
 */
class StochRsiStream {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        StochRsiStreamFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_stochrsistream_free(ptr, 0);
    }
    /**
     * Get the RSI period.
     * @returns {number}
     */
    get rsiPeriod() {
        const ret = wasm.stochrsistream_rsiPeriod(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Initialize with historical data.
     * Returns an object with `k` and `d` arrays.
     * @param {Float64Array} data
     * @returns {any}
     */
    init(data) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_export3);
            const len0 = WASM_VECTOR_LEN;
            wasm.stochrsistream_init(retptr, this.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the stochastic lookback period.
     * @returns {number}
     */
    get stochPeriod() {
        const ret = wasm.stochrsistream_stochPeriod(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Create a new streaming Stochastic RSI calculator.
     * @param {number} rsi_period
     * @param {number} stoch_period
     * @param {number} k_smooth
     * @param {number} d_period
     */
    constructor(rsi_period, stoch_period, k_smooth, d_period) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.stochrsistream_new(retptr, rsi_period, stoch_period, k_smooth, d_period);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            this.__wbg_ptr = r0 >>> 0;
            StochRsiStreamFinalization.register(this, this.__wbg_ptr, this);
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Process next value. Returns Stochastic RSI output or undefined if not ready.
     * @param {number} value
     * @returns {WasmStochRsiOutput | undefined}
     */
    next(value) {
        const ret = wasm.stochrsistream_next(this.__wbg_ptr, value);
        return ret === 0 ? undefined : WasmStochRsiOutput.__wrap(ret);
    }
    /**
     * Reset the calculator to initial state.
     */
    reset() {
        wasm.stochrsistream_reset(this.__wbg_ptr);
    }
    /**
     * Get the D period.
     * @returns {number}
     */
    get dPeriod() {
        const ret = wasm.stochrsistream_dPeriod(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Check if calculator has enough data to produce values.
     * @returns {boolean}
     */
    isReady() {
        const ret = wasm.stochrsistream_isReady(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Get the K smoothing period.
     * @returns {number}
     */
    get kSmooth() {
        const ret = wasm.stochrsistream_kSmooth(this.__wbg_ptr);
        return ret >>> 0;
    }
}
if (Symbol.dispose) StochRsiStream.prototype[Symbol.dispose] = StochRsiStream.prototype.free;
exports.StochRsiStream = StochRsiStream;

/**
 * Streaming Slow Stochastic calculator for real-time O(1) updates.
 */
class StochSlowStream {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        StochSlowStreamFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_stochslowstream_free(ptr, 0);
    }
    /**
     * Initialize with historical data. Takes parallel arrays of highs, lows, closes.
     * Returns array of Stochastic outputs as JS object with k and d arrays.
     * @param {Float64Array} highs
     * @param {Float64Array} lows
     * @param {Float64Array} closes
     * @returns {any}
     */
    init(highs, lows, closes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArrayF64ToWasm0(highs, wasm.__wbindgen_export3);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passArrayF64ToWasm0(lows, wasm.__wbindgen_export3);
            const len1 = WASM_VECTOR_LEN;
            const ptr2 = passArrayF64ToWasm0(closes, wasm.__wbindgen_export3);
            const len2 = WASM_VECTOR_LEN;
            wasm.stochfaststream_init(retptr, this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a new streaming Slow Stochastic calculator.
     * @param {number} k_period
     * @param {number} d_period
     * @param {number} slowing
     */
    constructor(k_period, d_period, slowing) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.stochslowstream_new(retptr, k_period, d_period, slowing);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            this.__wbg_ptr = r0 >>> 0;
            StochSlowStreamFinalization.register(this, this.__wbg_ptr, this);
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Process next bar. Takes high, low, close.
     * Returns Stochastic output or undefined if not ready.
     * @param {number} high
     * @param {number} low
     * @param {number} close
     * @returns {WasmStochOutput | undefined}
     */
    next(high, low, close) {
        const ret = wasm.stochfaststream_next(this.__wbg_ptr, high, low, close);
        return ret === 0 ? undefined : WasmStochOutput.__wrap(ret);
    }
    /**
     * Reset the calculator to initial state.
     */
    reset() {
        wasm.stochfaststream_reset(this.__wbg_ptr);
    }
    /**
     * Get the slowing period.
     * @returns {number}
     */
    get slowing() {
        const ret = wasm.adxstream_period(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Get the D period.
     * @returns {number}
     */
    get dPeriod() {
        const ret = wasm.stochfaststream_dPeriod(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Check if calculator has enough data to produce values.
     * @returns {boolean}
     */
    isReady() {
        const ret = wasm.stochfaststream_isReady(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Get the K period.
     * @returns {number}
     */
    get kPeriod() {
        const ret = wasm.stochfaststream_kPeriod(this.__wbg_ptr);
        return ret >>> 0;
    }
}
if (Symbol.dispose) StochSlowStream.prototype[Symbol.dispose] = StochSlowStream.prototype.free;
exports.StochSlowStream = StochSlowStream;

/**
 * Single row in the volume profile histogram returned to JavaScript.
 */
class VolumeProfileRow {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        VolumeProfileRowFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_volumeprofilerow_free(ptr, 0);
    }
    /**
     * Lower bound of the price bin
     * @returns {number}
     */
    get low() {
        const ret = wasm.anchoredvwapstream_cumulativeTpVolume(this.__wbg_ptr);
        return ret;
    }
    /**
     * Upper bound of the price bin
     * @returns {number}
     */
    get high() {
        const ret = wasm.anchoredvwapstream_cumulativeVolume(this.__wbg_ptr);
        return ret;
    }
    /**
     * Price level (center of the bin)
     * @returns {number}
     */
    get price() {
        const ret = wasm.bbandsstream_k(this.__wbg_ptr);
        return ret;
    }
    /**
     * Volume at this price level
     * @returns {number}
     */
    get volume() {
        const ret = wasm.frvpoutput_vah(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) VolumeProfileRow.prototype[Symbol.dispose] = VolumeProfileRow.prototype.free;
exports.VolumeProfileRow = VolumeProfileRow;

/**
 * ADX output for WASM.
 */
class WasmAdxOutput {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmAdxOutput.prototype);
        obj.__wbg_ptr = ptr;
        WasmAdxOutputFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmAdxOutputFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmadxoutput_free(ptr, 0);
    }
    /**
     * ADX value (0-100)
     * @returns {number}
     */
    get adx() {
        const ret = wasm.bbandsstream_k(this.__wbg_ptr);
        return ret;
    }
    /**
     * +DI value (0-100)
     * @returns {number}
     */
    get plusDi() {
        const ret = wasm.frvpoutput_vah(this.__wbg_ptr);
        return ret;
    }
    /**
     * -DI value (0-100)
     * @returns {number}
     */
    get minusDi() {
        const ret = wasm.anchoredvwapstream_cumulativeTpVolume(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) WasmAdxOutput.prototype[Symbol.dispose] = WasmAdxOutput.prototype.free;
exports.WasmAdxOutput = WasmAdxOutput;

/**
 * Bollinger Bands output for streaming mode.
 */
class WasmBBandsOutput {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmBBandsOutput.prototype);
        obj.__wbg_ptr = ptr;
        WasmBBandsOutputFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmBBandsOutputFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmbbandsoutput_free(ptr, 0);
    }
    /**
     * Lower band value
     * @returns {number}
     */
    get lower() {
        const ret = wasm.anchoredvwapstream_cumulativeTpVolume(this.__wbg_ptr);
        return ret;
    }
    /**
     * Upper band value
     * @returns {number}
     */
    get upper() {
        const ret = wasm.bbandsstream_k(this.__wbg_ptr);
        return ret;
    }
    /**
     * Middle band (SMA) value
     * @returns {number}
     */
    get middle() {
        const ret = wasm.frvpoutput_vah(this.__wbg_ptr);
        return ret;
    }
    /**
     * Bandwidth value
     * @returns {number}
     */
    get bandwidth() {
        const ret = wasm.frvpoutput_pocVolume(this.__wbg_ptr);
        return ret;
    }
    /**
     * %B indicator value
     * @returns {number}
     */
    get percentB() {
        const ret = wasm.anchoredvwapstream_cumulativeVolume(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) WasmBBandsOutput.prototype[Symbol.dispose] = WasmBBandsOutput.prototype.free;
exports.WasmBBandsOutput = WasmBBandsOutput;

/**
 * Ichimoku output for WASM.
 */
class WasmIchimokuOutput {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmIchimokuOutput.prototype);
        obj.__wbg_ptr = ptr;
        WasmIchimokuOutputFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmIchimokuOutputFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmichimokuoutput_free(ptr, 0);
    }
    /**
     * Tenkan-sen (Conversion Line)
     * @returns {number}
     */
    get tenkanSen() {
        const ret = wasm.bbandsstream_k(this.__wbg_ptr);
        return ret;
    }
    /**
     * Chikou Span (Lagging Span)
     * @returns {number}
     */
    get chikouSpan() {
        const ret = wasm.frvpoutput_pocVolume(this.__wbg_ptr);
        return ret;
    }
    /**
     * Senkou Span A (Leading Span A)
     * @returns {number}
     */
    get senkouSpanA() {
        const ret = wasm.anchoredvwapstream_cumulativeTpVolume(this.__wbg_ptr);
        return ret;
    }
    /**
     * Senkou Span B (Leading Span B)
     * @returns {number}
     */
    get senkouSpanB() {
        const ret = wasm.anchoredvwapstream_cumulativeVolume(this.__wbg_ptr);
        return ret;
    }
    /**
     * Kijun-sen (Base Line)
     * @returns {number}
     */
    get kijunSen() {
        const ret = wasm.frvpoutput_vah(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) WasmIchimokuOutput.prototype[Symbol.dispose] = WasmIchimokuOutput.prototype.free;
exports.WasmIchimokuOutput = WasmIchimokuOutput;

/**
 * Linear Regression output for WASM.
 */
class WasmLinRegOutput {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmLinRegOutput.prototype);
        obj.__wbg_ptr = ptr;
        WasmLinRegOutputFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmLinRegOutputFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmlinregoutput_free(ptr, 0);
    }
    /**
     * Pearson's R (-1 to 1)
     * @returns {number}
     */
    get r() {
        const ret = wasm.frvpoutput_pocVolume(this.__wbg_ptr);
        return ret;
    }
    /**
     * Lower channel
     * @returns {number}
     */
    get lower() {
        const ret = wasm.anchoredvwapstream_cumulativeTpVolume(this.__wbg_ptr);
        return ret;
    }
    /**
     * Slope
     * @returns {number}
     */
    get slope() {
        const ret = wasm.anchoredvwapstream_cumulativeVolume(this.__wbg_ptr);
        return ret;
    }
    /**
     * Upper channel
     * @returns {number}
     */
    get upper() {
        const ret = wasm.frvpoutput_vah(this.__wbg_ptr);
        return ret;
    }
    /**
     * Regression value
     * @returns {number}
     */
    get value() {
        const ret = wasm.bbandsstream_k(this.__wbg_ptr);
        return ret;
    }
    /**
     * R-squared (0 to 1)
     * @returns {number}
     */
    get rSquared() {
        const ret = wasm.frvpoutput_valueAreaVolume(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) WasmLinRegOutput.prototype[Symbol.dispose] = WasmLinRegOutput.prototype.free;
exports.WasmLinRegOutput = WasmLinRegOutput;

/**
 * MACD output returned from JavaScript.
 */
class WasmMacdOutput {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmMacdOutput.prototype);
        obj.__wbg_ptr = ptr;
        WasmMacdOutputFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmMacdOutputFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmmacdoutput_free(ptr, 0);
    }
    /**
     * MACD line value
     * @returns {number}
     */
    get macd() {
        const ret = wasm.bbandsstream_k(this.__wbg_ptr);
        return ret;
    }
    /**
     * Signal line value
     * @returns {number}
     */
    get signal() {
        const ret = wasm.frvpoutput_vah(this.__wbg_ptr);
        return ret;
    }
    /**
     * Histogram value
     * @returns {number}
     */
    get histogram() {
        const ret = wasm.anchoredvwapstream_cumulativeTpVolume(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) WasmMacdOutput.prototype[Symbol.dispose] = WasmMacdOutput.prototype.free;
exports.WasmMacdOutput = WasmMacdOutput;

/**
 * Pivot Points output returned to JavaScript.
 */
class WasmPivotPointsOutput {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmPivotPointsOutput.prototype);
        obj.__wbg_ptr = ptr;
        WasmPivotPointsOutputFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmPivotPointsOutputFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmpivotpointsoutput_free(ptr, 0);
    }
    /**
     * First resistance level
     * @returns {number}
     */
    get r1() {
        const ret = wasm.frvpoutput_vah(this.__wbg_ptr);
        return ret;
    }
    /**
     * Second resistance level
     * @returns {number}
     */
    get r2() {
        const ret = wasm.anchoredvwapstream_cumulativeTpVolume(this.__wbg_ptr);
        return ret;
    }
    /**
     * Third resistance level
     * @returns {number}
     */
    get r3() {
        const ret = wasm.anchoredvwapstream_cumulativeVolume(this.__wbg_ptr);
        return ret;
    }
    /**
     * First support level
     * @returns {number}
     */
    get s1() {
        const ret = wasm.frvpoutput_pocVolume(this.__wbg_ptr);
        return ret;
    }
    /**
     * Second support level
     * @returns {number}
     */
    get s2() {
        const ret = wasm.frvpoutput_valueAreaVolume(this.__wbg_ptr);
        return ret;
    }
    /**
     * Third support level
     * @returns {number}
     */
    get s3() {
        const ret = wasm.frvpoutput_rangeHigh(this.__wbg_ptr);
        return ret;
    }
    /**
     * The pivot point (central level)
     * @returns {number}
     */
    get pivot() {
        const ret = wasm.bbandsstream_k(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) WasmPivotPointsOutput.prototype[Symbol.dispose] = WasmPivotPointsOutput.prototype.free;
exports.WasmPivotPointsOutput = WasmPivotPointsOutput;

/**
 * Stochastic output returned to JavaScript.
 */
class WasmStochOutput {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmStochOutput.prototype);
        obj.__wbg_ptr = ptr;
        WasmStochOutputFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmStochOutputFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmstochoutput_free(ptr, 0);
    }
    /**
     * %D line value (0-100) - signal line
     * @returns {number}
     */
    get d() {
        const ret = wasm.frvpoutput_vah(this.__wbg_ptr);
        return ret;
    }
    /**
     * %K line value (0-100)
     * @returns {number}
     */
    get k() {
        const ret = wasm.bbandsstream_k(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) WasmStochOutput.prototype[Symbol.dispose] = WasmStochOutput.prototype.free;
exports.WasmStochOutput = WasmStochOutput;

/**
 * Stochastic RSI output returned to JavaScript.
 */
class WasmStochRsiOutput {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmStochRsiOutput.prototype);
        obj.__wbg_ptr = ptr;
        WasmStochRsiOutputFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmStochRsiOutputFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmstochrsioutput_free(ptr, 0);
    }
    /**
     * %D line value (0-100) - signal line
     * @returns {number}
     */
    get d() {
        const ret = wasm.frvpoutput_vah(this.__wbg_ptr);
        return ret;
    }
    /**
     * %K line value (0-100)
     * @returns {number}
     */
    get k() {
        const ret = wasm.bbandsstream_k(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) WasmStochRsiOutput.prototype[Symbol.dispose] = WasmStochRsiOutput.prototype.free;
exports.WasmStochRsiOutput = WasmStochRsiOutput;

/**
 * Streaming WMA calculator for real-time O(1) updates.
 */
class WmaStream {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WmaStreamFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wmastream_free(ptr, 0);
    }
    /**
     * Initialize with historical data. Returns array of WMA values.
     * @param {Float64Array} data
     * @returns {Float64Array}
     */
    init(data) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_export3);
            const len0 = WASM_VECTOR_LEN;
            wasm.wmastream_init(retptr, this.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v2 = getArrayF64FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export(r0, r1 * 8, 8);
            return v2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a new streaming WMA calculator.
     * @param {number} period
     */
    constructor(period) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.wmastream_new(retptr, period);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            this.__wbg_ptr = r0 >>> 0;
            WmaStreamFinalization.register(this, this.__wbg_ptr, this);
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Process next value. Returns WMA or NaN if not ready.
     * @param {number} value
     * @returns {number}
     */
    next(value) {
        const ret = wasm.wmastream_next(this.__wbg_ptr, value);
        return ret;
    }
    /**
     * Reset the calculator to initial state.
     */
    reset() {
        wasm.bbandsstream_reset(this.__wbg_ptr);
    }
    /**
     * Get the period.
     * @returns {number}
     */
    get period() {
        const ret = wasm.bbandsstream_period(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Check if calculator has enough data to produce values.
     * @returns {boolean}
     */
    isReady() {
        const ret = wasm.bbandsstream_isReady(this.__wbg_ptr);
        return ret !== 0;
    }
}
if (Symbol.dispose) WmaStream.prototype[Symbol.dispose] = WmaStream.prototype.free;
exports.WmaStream = WmaStream;

/**
 * Calculate ADX for arrays of high, low, and close prices.
 *
 * Returns an object with `adx`, `plusDi`, and `minusDi` arrays.
 * @param {Float64Array} highs
 * @param {Float64Array} lows
 * @param {Float64Array} closes
 * @param {number} period
 * @returns {any}
 */
function adx(highs, lows, closes, period) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArrayF64ToWasm0(highs, wasm.__wbindgen_export3);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayF64ToWasm0(lows, wasm.__wbindgen_export3);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArrayF64ToWasm0(closes, wasm.__wbindgen_export3);
        const len2 = WASM_VECTOR_LEN;
        wasm.adx(retptr, ptr0, len0, ptr1, len1, ptr2, len2, period);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        if (r2) {
            throw takeObject(r1);
        }
        return takeObject(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}
exports.adx = adx;

/**
 * Calculate Anchored VWAP starting from a specific index.
 *
 * Takes OHLCV arrays and anchor index, returns VWAP values.
 * @param {Float64Array} timestamps
 * @param {Float64Array} opens
 * @param {Float64Array} highs
 * @param {Float64Array} lows
 * @param {Float64Array} closes
 * @param {Float64Array} volumes
 * @param {number} anchor_index
 * @returns {Float64Array}
 */
function anchoredVwap(timestamps, opens, highs, lows, closes, volumes, anchor_index) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArrayF64ToWasm0(timestamps, wasm.__wbindgen_export3);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayF64ToWasm0(opens, wasm.__wbindgen_export3);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArrayF64ToWasm0(highs, wasm.__wbindgen_export3);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passArrayF64ToWasm0(lows, wasm.__wbindgen_export3);
        const len3 = WASM_VECTOR_LEN;
        const ptr4 = passArrayF64ToWasm0(closes, wasm.__wbindgen_export3);
        const len4 = WASM_VECTOR_LEN;
        const ptr5 = passArrayF64ToWasm0(volumes, wasm.__wbindgen_export3);
        const len5 = WASM_VECTOR_LEN;
        wasm.anchoredVwap(retptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, ptr5, len5, anchor_index);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        if (r3) {
            throw takeObject(r2);
        }
        var v7 = getArrayF64FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export(r0, r1 * 8, 8);
        return v7;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}
exports.anchoredVwap = anchoredVwap;

/**
 * Calculate Anchored VWAP starting from a specific timestamp.
 *
 * Takes OHLCV arrays and anchor timestamp (Unix ms), returns VWAP values.
 * @param {Float64Array} timestamps
 * @param {Float64Array} opens
 * @param {Float64Array} highs
 * @param {Float64Array} lows
 * @param {Float64Array} closes
 * @param {Float64Array} volumes
 * @param {number} anchor_timestamp
 * @returns {Float64Array}
 */
function anchoredVwapFromTimestamp(timestamps, opens, highs, lows, closes, volumes, anchor_timestamp) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArrayF64ToWasm0(timestamps, wasm.__wbindgen_export3);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayF64ToWasm0(opens, wasm.__wbindgen_export3);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArrayF64ToWasm0(highs, wasm.__wbindgen_export3);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passArrayF64ToWasm0(lows, wasm.__wbindgen_export3);
        const len3 = WASM_VECTOR_LEN;
        const ptr4 = passArrayF64ToWasm0(closes, wasm.__wbindgen_export3);
        const len4 = WASM_VECTOR_LEN;
        const ptr5 = passArrayF64ToWasm0(volumes, wasm.__wbindgen_export3);
        const len5 = WASM_VECTOR_LEN;
        wasm.anchoredVwapFromTimestamp(retptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, ptr5, len5, anchor_timestamp);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        if (r3) {
            throw takeObject(r2);
        }
        var v7 = getArrayF64FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export(r0, r1 * 8, 8);
        return v7;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}
exports.anchoredVwapFromTimestamp = anchoredVwapFromTimestamp;

/**
 * Calculate ATR for arrays of high, low, and close prices.
 *
 * Returns Float64Array with NaN for insufficient data points.
 * @param {Float64Array} highs
 * @param {Float64Array} lows
 * @param {Float64Array} closes
 * @param {number} period
 * @returns {Float64Array}
 */
function atr(highs, lows, closes, period) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArrayF64ToWasm0(highs, wasm.__wbindgen_export3);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayF64ToWasm0(lows, wasm.__wbindgen_export3);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArrayF64ToWasm0(closes, wasm.__wbindgen_export3);
        const len2 = WASM_VECTOR_LEN;
        wasm.atr(retptr, ptr0, len0, ptr1, len1, ptr2, len2, period);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        if (r3) {
            throw takeObject(r2);
        }
        var v4 = getArrayF64FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export(r0, r1 * 8, 8);
        return v4;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}
exports.atr = atr;

/**
 * Calculate Bollinger Bands for an array of prices.
 *
 * Returns an object with `upper`, `middle`, `lower`, `percentB`, and `bandwidth` arrays.
 * @param {Float64Array} data
 * @param {number} period
 * @param {number} k
 * @returns {any}
 */
function bbands(data, period, k) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_export3);
        const len0 = WASM_VECTOR_LEN;
        wasm.bbands(retptr, ptr0, len0, period, k);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        if (r2) {
            throw takeObject(r1);
        }
        return takeObject(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}
exports.bbands = bbands;

/**
 * Calculate CVD from pre-computed delta values.
 *
 * Delta = buy_volume - sell_volume for each bar.
 * CVD is the running sum of deltas.
 *
 * Returns Float64Array of cumulative volume delta values.
 * @param {Float64Array} deltas
 * @returns {Float64Array}
 */
function cvd(deltas) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArrayF64ToWasm0(deltas, wasm.__wbindgen_export3);
        const len0 = WASM_VECTOR_LEN;
        wasm.cvd(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        if (r3) {
            throw takeObject(r2);
        }
        var v2 = getArrayF64FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export(r0, r1 * 8, 8);
        return v2;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}
exports.cvd = cvd;

/**
 * Calculate CVD from OHLCV data using volume approximation.
 *
 * Approximates buy/sell volume using the formula:
 * - buy_ratio = (close - low) / (high - low)
 * - buy_volume = volume * buy_ratio
 * - sell_volume = volume * (1 - buy_ratio)
 * - delta = buy_volume - sell_volume
 *
 * Returns Float64Array of cumulative volume delta values.
 * @param {Float64Array} highs
 * @param {Float64Array} lows
 * @param {Float64Array} closes
 * @param {Float64Array} volumes
 * @returns {Float64Array}
 */
function cvdOhlcv(highs, lows, closes, volumes) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArrayF64ToWasm0(highs, wasm.__wbindgen_export3);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayF64ToWasm0(lows, wasm.__wbindgen_export3);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArrayF64ToWasm0(closes, wasm.__wbindgen_export3);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passArrayF64ToWasm0(volumes, wasm.__wbindgen_export3);
        const len3 = WASM_VECTOR_LEN;
        wasm.cvdOhlcv(retptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        if (r3) {
            throw takeObject(r2);
        }
        var v5 = getArrayF64FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export(r0, r1 * 8, 8);
        return v5;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}
exports.cvdOhlcv = cvdOhlcv;

/**
 * Calculate EMA for an array of prices.
 *
 * Returns Float64Array with NaN for insufficient data points.
 * @param {Float64Array} data
 * @param {number} period
 * @returns {Float64Array}
 */
function ema(data, period) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_export3);
        const len0 = WASM_VECTOR_LEN;
        wasm.ema(retptr, ptr0, len0, period);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        if (r3) {
            throw takeObject(r2);
        }
        var v2 = getArrayF64FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export(r0, r1 * 8, 8);
        return v2;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}
exports.ema = ema;

/**
 * Calculate Fixed Range Volume Profile.
 *
 * Takes OHLCV arrays and returns volume profile with POC, VAH, VAL.
 *
 * @param highs - Array of high prices
 * @param lows - Array of low prices
 * @param closes - Array of close prices
 * @param volumes - Array of volumes
 * @param numBins - Number of price bins (rows) in histogram (default 100)
 * @param valueAreaPercent - Percentage of volume for value area (0.0-1.0, default 0.70)
 * @param {Float64Array} highs
 * @param {Float64Array} lows
 * @param {Float64Array} closes
 * @param {Float64Array} volumes
 * @param {number | null} [num_bins]
 * @param {number | null} [value_area_percent]
 * @returns {FrvpOutput}
 */
function frvp(highs, lows, closes, volumes, num_bins, value_area_percent) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArrayF64ToWasm0(highs, wasm.__wbindgen_export3);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayF64ToWasm0(lows, wasm.__wbindgen_export3);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArrayF64ToWasm0(closes, wasm.__wbindgen_export3);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passArrayF64ToWasm0(volumes, wasm.__wbindgen_export3);
        const len3 = WASM_VECTOR_LEN;
        wasm.frvp(retptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, isLikeNone(num_bins) ? 0x100000001 : (num_bins) >>> 0, !isLikeNone(value_area_percent), isLikeNone(value_area_percent) ? 0 : value_area_percent);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        if (r2) {
            throw takeObject(r1);
        }
        return FrvpOutput.__wrap(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}
exports.frvp = frvp;

/**
 * Calculate HMA for an array of prices.
 *
 * Returns Float64Array with NaN for insufficient data points.
 * @param {Float64Array} data
 * @param {number} period
 * @returns {Float64Array}
 */
function hma(data, period) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_export3);
        const len0 = WASM_VECTOR_LEN;
        wasm.hma(retptr, ptr0, len0, period);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        if (r3) {
            throw takeObject(r2);
        }
        var v2 = getArrayF64FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export(r0, r1 * 8, 8);
        return v2;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}
exports.hma = hma;

/**
 * Calculate Ichimoku Cloud for arrays of high, low, and close prices.
 *
 * Returns an object with arrays for each component.
 * @param {Float64Array} highs
 * @param {Float64Array} lows
 * @param {Float64Array} closes
 * @param {number} tenkan_period
 * @param {number} kijun_period
 * @param {number} senkou_b_period
 * @returns {any}
 */
function ichimoku(highs, lows, closes, tenkan_period, kijun_period, senkou_b_period) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArrayF64ToWasm0(highs, wasm.__wbindgen_export3);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayF64ToWasm0(lows, wasm.__wbindgen_export3);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArrayF64ToWasm0(closes, wasm.__wbindgen_export3);
        const len2 = WASM_VECTOR_LEN;
        wasm.ichimoku(retptr, ptr0, len0, ptr1, len1, ptr2, len2, tenkan_period, kijun_period, senkou_b_period);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        if (r2) {
            throw takeObject(r1);
        }
        return takeObject(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}
exports.ichimoku = ichimoku;

/**
 * Initialize panic hook for better error messages in WASM.
 */
function init() {
    wasm.init();
}
exports.init = init;

/**
 * Calculate Linear Regression Channels for an array of prices.
 *
 * Returns an object with arrays for value, upper, lower, slope, r, and rSquared.
 * @param {Float64Array} data
 * @param {number} period
 * @param {number | null} [num_std_dev]
 * @returns {any}
 */
function linreg(data, period, num_std_dev) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_export3);
        const len0 = WASM_VECTOR_LEN;
        wasm.linreg(retptr, ptr0, len0, period, !isLikeNone(num_std_dev), isLikeNone(num_std_dev) ? 0 : num_std_dev);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        if (r2) {
            throw takeObject(r1);
        }
        return takeObject(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}
exports.linreg = linreg;

/**
 * Calculate MACD for an array of prices.
 *
 * Returns an object with `macd`, `signal`, and `histogram` arrays.
 * @param {Float64Array} data
 * @param {number} fast_period
 * @param {number} slow_period
 * @param {number} signal_period
 * @returns {any}
 */
function macd(data, fast_period, slow_period, signal_period) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_export3);
        const len0 = WASM_VECTOR_LEN;
        wasm.macd(retptr, ptr0, len0, fast_period, slow_period, signal_period);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        if (r2) {
            throw takeObject(r1);
        }
        return takeObject(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}
exports.macd = macd;

/**
 * Calculate MFI for arrays of high, low, close, and volume prices.
 *
 * Returns Float64Array with NaN for insufficient data points.
 * @param {Float64Array} highs
 * @param {Float64Array} lows
 * @param {Float64Array} closes
 * @param {Float64Array} volumes
 * @param {number} period
 * @returns {Float64Array}
 */
function mfi(highs, lows, closes, volumes, period) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArrayF64ToWasm0(highs, wasm.__wbindgen_export3);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayF64ToWasm0(lows, wasm.__wbindgen_export3);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArrayF64ToWasm0(closes, wasm.__wbindgen_export3);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passArrayF64ToWasm0(volumes, wasm.__wbindgen_export3);
        const len3 = WASM_VECTOR_LEN;
        wasm.mfi(retptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, period);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        if (r3) {
            throw takeObject(r2);
        }
        var v5 = getArrayF64FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export(r0, r1 * 8, 8);
        return v5;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}
exports.mfi = mfi;

/**
 * Calculate Pivot Points from a single candle (high, low, close).
 *
 * Returns an object with pivot, r1, r2, r3, s1, s2, s3 properties.
 *
 * @param high - The high price of the period
 * @param low - The low price of the period
 * @param close - The close price of the period
 * @param variant - 'standard', 'fibonacci', or 'woodie'
 * @param {number} high
 * @param {number} low
 * @param {number} close
 * @param {string} variant
 * @returns {WasmPivotPointsOutput}
 */
function pivotPoints(high, low, close, variant) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(variant, wasm.__wbindgen_export3, wasm.__wbindgen_export4);
        const len0 = WASM_VECTOR_LEN;
        wasm.pivotPoints(retptr, high, low, close, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        if (r2) {
            throw takeObject(r1);
        }
        return WasmPivotPointsOutput.__wrap(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}
exports.pivotPoints = pivotPoints;

/**
 * Calculate Pivot Points for arrays of (highs, lows, closes).
 *
 * Returns an object with arrays for each level: pivot, r1, r2, r3, s1, s2, s3.
 *
 * @param highs - Array of high prices
 * @param lows - Array of low prices
 * @param closes - Array of close prices
 * @param variant - 'standard', 'fibonacci', or 'woodie'
 * @param {Float64Array} highs
 * @param {Float64Array} lows
 * @param {Float64Array} closes
 * @param {string} variant
 * @returns {any}
 */
function pivotPointsBatch(highs, lows, closes, variant) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArrayF64ToWasm0(highs, wasm.__wbindgen_export3);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayF64ToWasm0(lows, wasm.__wbindgen_export3);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArrayF64ToWasm0(closes, wasm.__wbindgen_export3);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passStringToWasm0(variant, wasm.__wbindgen_export3, wasm.__wbindgen_export4);
        const len3 = WASM_VECTOR_LEN;
        wasm.pivotPointsBatch(retptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        if (r2) {
            throw takeObject(r1);
        }
        return takeObject(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}
exports.pivotPointsBatch = pivotPointsBatch;

/**
 * Calculate Rolling VWAP with a sliding window.
 *
 * Takes OHLCV arrays and period, returns VWAP values.
 * @param {Float64Array} timestamps
 * @param {Float64Array} opens
 * @param {Float64Array} highs
 * @param {Float64Array} lows
 * @param {Float64Array} closes
 * @param {Float64Array} volumes
 * @param {number} period
 * @returns {Float64Array}
 */
function rollingVwap(timestamps, opens, highs, lows, closes, volumes, period) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArrayF64ToWasm0(timestamps, wasm.__wbindgen_export3);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayF64ToWasm0(opens, wasm.__wbindgen_export3);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArrayF64ToWasm0(highs, wasm.__wbindgen_export3);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passArrayF64ToWasm0(lows, wasm.__wbindgen_export3);
        const len3 = WASM_VECTOR_LEN;
        const ptr4 = passArrayF64ToWasm0(closes, wasm.__wbindgen_export3);
        const len4 = WASM_VECTOR_LEN;
        const ptr5 = passArrayF64ToWasm0(volumes, wasm.__wbindgen_export3);
        const len5 = WASM_VECTOR_LEN;
        wasm.rollingVwap(retptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, ptr5, len5, period);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        if (r3) {
            throw takeObject(r2);
        }
        var v7 = getArrayF64FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export(r0, r1 * 8, 8);
        return v7;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}
exports.rollingVwap = rollingVwap;

/**
 * Calculate RSI for an array of prices.
 *
 * Returns Float64Array with NaN for insufficient data points.
 * @param {Float64Array} data
 * @param {number} period
 * @returns {Float64Array}
 */
function rsi(data, period) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_export3);
        const len0 = WASM_VECTOR_LEN;
        wasm.rsi(retptr, ptr0, len0, period);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        if (r3) {
            throw takeObject(r2);
        }
        var v2 = getArrayF64FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export(r0, r1 * 8, 8);
        return v2;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}
exports.rsi = rsi;

/**
 * Calculate Session VWAP (resets daily at UTC midnight).
 *
 * Takes OHLCV arrays and returns VWAP values.
 * @param {Float64Array} timestamps
 * @param {Float64Array} opens
 * @param {Float64Array} highs
 * @param {Float64Array} lows
 * @param {Float64Array} closes
 * @param {Float64Array} volumes
 * @returns {Float64Array}
 */
function sessionVwap(timestamps, opens, highs, lows, closes, volumes) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArrayF64ToWasm0(timestamps, wasm.__wbindgen_export3);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayF64ToWasm0(opens, wasm.__wbindgen_export3);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArrayF64ToWasm0(highs, wasm.__wbindgen_export3);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passArrayF64ToWasm0(lows, wasm.__wbindgen_export3);
        const len3 = WASM_VECTOR_LEN;
        const ptr4 = passArrayF64ToWasm0(closes, wasm.__wbindgen_export3);
        const len4 = WASM_VECTOR_LEN;
        const ptr5 = passArrayF64ToWasm0(volumes, wasm.__wbindgen_export3);
        const len5 = WASM_VECTOR_LEN;
        wasm.sessionVwap(retptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, ptr5, len5);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        if (r3) {
            throw takeObject(r2);
        }
        var v7 = getArrayF64FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export(r0, r1 * 8, 8);
        return v7;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}
exports.sessionVwap = sessionVwap;

/**
 * Calculate SMA for an array of prices.
 *
 * Returns Float64Array with NaN for insufficient data points.
 * @param {Float64Array} data
 * @param {number} period
 * @returns {Float64Array}
 */
function sma(data, period) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_export3);
        const len0 = WASM_VECTOR_LEN;
        wasm.sma(retptr, ptr0, len0, period);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        if (r3) {
            throw takeObject(r2);
        }
        var v2 = getArrayF64FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export(r0, r1 * 8, 8);
        return v2;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}
exports.sma = sma;

/**
 * Calculate Fast Stochastic for arrays of high, low, and close prices.
 *
 * Returns an object with `k` and `d` arrays.
 * @param {Float64Array} highs
 * @param {Float64Array} lows
 * @param {Float64Array} closes
 * @param {number} k_period
 * @param {number} d_period
 * @returns {any}
 */
function stochFast(highs, lows, closes, k_period, d_period) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArrayF64ToWasm0(highs, wasm.__wbindgen_export3);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayF64ToWasm0(lows, wasm.__wbindgen_export3);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArrayF64ToWasm0(closes, wasm.__wbindgen_export3);
        const len2 = WASM_VECTOR_LEN;
        wasm.stochFast(retptr, ptr0, len0, ptr1, len1, ptr2, len2, k_period, d_period);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        if (r2) {
            throw takeObject(r1);
        }
        return takeObject(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}
exports.stochFast = stochFast;

/**
 * Calculate Stochastic RSI for an array of prices.
 *
 * Returns an object with `k` and `d` arrays.
 * @param {Float64Array} data
 * @param {number} rsi_period
 * @param {number} stoch_period
 * @param {number} k_smooth
 * @param {number} d_period
 * @returns {any}
 */
function stochRsi(data, rsi_period, stoch_period, k_smooth, d_period) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_export3);
        const len0 = WASM_VECTOR_LEN;
        wasm.stochRsi(retptr, ptr0, len0, rsi_period, stoch_period, k_smooth, d_period);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        if (r2) {
            throw takeObject(r1);
        }
        return takeObject(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}
exports.stochRsi = stochRsi;

/**
 * Calculate Slow Stochastic for arrays of high, low, and close prices.
 *
 * Returns an object with `k` and `d` arrays.
 * @param {Float64Array} highs
 * @param {Float64Array} lows
 * @param {Float64Array} closes
 * @param {number} k_period
 * @param {number} d_period
 * @param {number} slowing
 * @returns {any}
 */
function stochSlow(highs, lows, closes, k_period, d_period, slowing) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArrayF64ToWasm0(highs, wasm.__wbindgen_export3);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayF64ToWasm0(lows, wasm.__wbindgen_export3);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArrayF64ToWasm0(closes, wasm.__wbindgen_export3);
        const len2 = WASM_VECTOR_LEN;
        wasm.stochSlow(retptr, ptr0, len0, ptr1, len1, ptr2, len2, k_period, d_period, slowing);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        if (r2) {
            throw takeObject(r1);
        }
        return takeObject(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}
exports.stochSlow = stochSlow;

/**
 * Calculate WMA for an array of prices.
 *
 * Returns Float64Array with NaN for insufficient data points.
 * @param {Float64Array} data
 * @param {number} period
 * @returns {Float64Array}
 */
function wma(data, period) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_export3);
        const len0 = WASM_VECTOR_LEN;
        wasm.wma(retptr, ptr0, len0, period);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        if (r3) {
            throw takeObject(r2);
        }
        var v2 = getArrayF64FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export(r0, r1 * 8, 8);
        return v2;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}
exports.wma = wma;

exports.__wbg_Error_52673b7de5a0ca89 = function(arg0, arg1) {
    const ret = Error(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

exports.__wbg___wbindgen_throw_dd24417ed36fc46e = function(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};

exports.__wbg_error_7534b8e9a36f1ab4 = function(arg0, arg1) {
    let deferred0_0;
    let deferred0_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        console.error(getStringFromWasm0(arg0, arg1));
    } finally {
        wasm.__wbindgen_export(deferred0_0, deferred0_1, 1);
    }
};

exports.__wbg_new_1ba21ce319a06297 = function() {
    const ret = new Object();
    return addHeapObject(ret);
};

exports.__wbg_new_8a6f238a6ece86ea = function() {
    const ret = new Error();
    return addHeapObject(ret);
};

exports.__wbg_new_from_slice_9a48ef80d2a51f94 = function(arg0, arg1) {
    const ret = new Float64Array(getArrayF64FromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

exports.__wbg_set_781438a03c0c3c81 = function() { return handleError(function (arg0, arg1, arg2) {
    const ret = Reflect.set(getObject(arg0), getObject(arg1), getObject(arg2));
    return ret;
}, arguments) };

exports.__wbg_stack_0ed75d68575b0f3c = function(arg0, arg1) {
    const ret = getObject(arg1).stack;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export3, wasm.__wbindgen_export4);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

exports.__wbindgen_cast_2241b6af4c4b2941 = function(arg0, arg1) {
    // Cast intrinsic for `Ref(String) -> Externref`.
    const ret = getStringFromWasm0(arg0, arg1);
    return addHeapObject(ret);
};

exports.__wbindgen_object_drop_ref = function(arg0) {
    takeObject(arg0);
};

const wasmPath = `${__dirname}/ta_core_bg.wasm`;
const wasmBytes = require('fs').readFileSync(wasmPath);
const wasmModule = new WebAssembly.Module(wasmBytes);
const wasm = exports.__wasm = new WebAssembly.Instance(wasmModule, imports).exports;

wasm.__wbindgen_start();
