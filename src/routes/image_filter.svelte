<script>
	import sortWorkerUrl from './sort_worker.js?url';
	import FilterMatrix from './filter_matrix.svelte';

	export let input_url;
	let image;
	let canvas;
	let input_div;
	let outCanv;
	let value = 'contrast';
	let outImgDat;
	let inpContxt;
	let outContxt;
	let imagedata;
	let contThres = 100;
	let sortMinThresh = 100;
	let sortMaxThresh = 150;
	let minThreshControl;
	const THREADS = 6;
	let active = true;
	let filter = [
		[0.0625, 0.125, 0.0625],
		[0.125, 0.25, 0.125],
		[0.0625, 0.125, 0.0625]
	];
	let filterMatEn = true;

	function get2DArray(imagedata, rowLength) {
		let len = imagedata.length;
		let rows = [];
		let col = [];
		let count = 0;
		for (let i = 0; i < len; i += 4) {
			col.push([imagedata[i], imagedata[i + 1], imagedata[i + 2], imagedata[i + 3]]);
			count += 1;
			if (count >= rowLength) {
				rows.push(col);
				col = [];
				count = 0;
			}
		}
		return rows;
	}

	function get1DArray(array2D) {
		let pixdat = [];
		for (let i = 0; i < array2D.length; i++) {
			for (let j = 0; j < array2D[i].length; j++) {
				pixdat.push(array2D[i][j][0], array2D[i][j][1], array2D[i][j][2], array2D[i][j][3]);
			}
		}
		return pixdat;
	}
	/*
	function blackAndWhite(pixelArray) {
		let outputArray = [...Array(pixelArray.length)].map(_=>Array(pixelArray[0].length).fill(0))

		for (let i = 0; i < pixelArray.length; i++) {
			for (let j = 0; j < pixelArray[i].length; j++) {
				outputArray[i][j] = (pixelArray[i][j][0] + pixelArray[i][j][1] + pixelArray[i][j][2]) / 3;
			}
		}
		for (let i = 1; i < outputArray.length - 1; i++) {
			for (let j = 1; j < outputArray[i].length - 1; j++) {
				const pix0 = outputArray[i - 1][j - 1] * filter[0][0];
				const pix1 = outputArray[i - 1][j] * filter[0][1];
				const pix2 = outputArray[i - 1][j + 1] * filter[0][2];

				const pix3 = outputArray[i][j - 1] * filter[1][0];
				const pix4 = outputArray[i][j] * filter[1][1];
				const pix5 = outputArray[i][j + 1] * filter[1][2];

				const pix6 = outputArray[i + 1][j - 1] * filter[2][0];
				const pix7 = outputArray[i + 1][j] * filter[2][1];
				const pix8 = outputArray[i + 1][j + 1] * filter[2][2];

				const newpixel = (pix0 + pix1 + pix2 + pix3 + pix4 + pix5 + pix6 + pix7 + pix8) / 9;
				outputArray[i][j] = newpixel
			}
		}
		console.log(outputArray);
		return outputArray;
	}

	function applyFilter(pixelArray,monoArray) {
		for (let i = 1; i < pixelArray.length - 1; i++) {
			for (let j = 1; j < pixelArray[i].length - 1; j++) {
				for (let k = 0; k < 3; k++) {
					const val = (pixelArray[i][j][k]*monoArray[i][j])/255
					pixelArray[i][j][k] = Math.min(Math.max(val, 0), 255);
				}
			}
		}
		finalizeCanvas(pixelArray);
		filterMatEn = true;
	}
*/
	function applyContrast(pixelArray, Thresh) {
		for (let i = 1; i < pixelArray.length - 1; i++) {
			for (let j = 1; j < pixelArray[i].length - 1; j++) {
				let pix = 0;
				for (let k = 0; k < 3; k++) {
					pix += pixelArray[i][j][k];
				}
				pix = pix / 3;
				if (pix > Thresh) {
					pix = 255;
				} else {
					pix = 0;
				}
				pixelArray[i][j][0] = pix;
				pixelArray[i][j][1] = pix;
				pixelArray[i][j][2] = pix;
			}
		}
		return pixelArray;
	}

	function applyClamp(pixelArray, minThresh, maxThresh) {
		for (let i = 1; i < pixelArray.length - 1; i++) {
			for (let j = 1; j < pixelArray[i].length - 1; j++) {
				let pix = 0;
				for (let k = 0; k < 3; k++) {
					pix += pixelArray[i][j][k];
				}
				pix = pix / 3;
				if (pix > maxThresh) {
					pix = 0;
				} else if (pix < minThresh) {
					pix = 0;
				} else {
					pix = 255;
				}
				pixelArray[i][j][0] = pix;
				pixelArray[i][j][1] = pix;
				pixelArray[i][j][2] = pix;
			}
		}
		return pixelArray;
	}

	function pixelSorting(pixelArray) {
		let origData = get2DArray(imagedata, canvas.width);
		console.log(origData);
		const promises = run_sorting_worker(pixelArray, origData, THREADS);
		let finalArray = [];
		Promise.all(promises).then(function (data) {
			data.forEach((arr) => {
				arr.forEach((el) => {
					finalArray.push(el);
				});
			});
			finalizeCanvas(finalArray);
			active = true;
		});
	}
	function pixelSortingVert(pixelArray) {
		let origData = transpose(get2DArray(imagedata, canvas.width));
		pixelArray = transpose(pixelArray);
		const promises = run_sorting_worker(pixelArray, origData, THREADS);
		let finalArray = [];
		Promise.all(promises).then(function (data) {
			data.forEach((arr) => {
				arr.forEach((el) => {
					finalArray.push(el);
				});
			});
			finalArray = transpose(finalArray);
			finalizeCanvas(finalArray);
			active = true;
		});
	}

	function setupCanvas() {
		canvas.height = image.height;
		canvas.width = image.width;
		console.log(canvas.height, canvas.width);
		inpContxt = canvas.getContext('2d');
		inpContxt.drawImage(image, 0, 0);
		imagedata = inpContxt.getImageData(0, 0, canvas.width, canvas.height).data;
		outCanv.height = canvas.height;
		outCanv.width = canvas.width;
		outContxt = outCanv.getContext('2d');
	}

	function finalizeCanvas(filteredArray) {
		let pixdat = get1DArray(filteredArray);
		pixdat = new Uint8ClampedArray(pixdat);
		outImgDat = new ImageData(pixdat, outCanv.width);
		outContxt.putImageData(outImgDat, 0, 0);
		outImgDat = undefined;
	}

	function setupOutput() {
		const rgbaPixelArray = get2DArray(imagedata, canvas.width);
		let filteredArray;
		if (value == 'filter') {
			const monoArray = blackAndWhite(rgbaPixelArray)
			applyFilter(rgbaPixelArray,monoArray);
			return;
		} else if (value == 'contrast') {
			filteredArray = applyContrast(rgbaPixelArray, contThres);
		} else if (value == 'pixel_sorter') {
			active = false;
			filteredArray = applyClamp(rgbaPixelArray, sortMinThresh, sortMaxThresh);
			pixelSorting(filteredArray);
			return;
		} else if (value == 'pixel_sorter_vert') {
			active = false;
			filteredArray = applyClamp(rgbaPixelArray, sortMinThresh, sortMaxThresh);
			pixelSortingVert(filteredArray);
			return;
		}
		finalizeCanvas(filteredArray);
	}

	function transpose(matrix) {
		return matrix[0].map((col, i) => matrix.map((row) => row[i]));
	}

	function run_sorting_worker(array, orig, threads) {
		const [data, ori] = splitWork_sorting(array, orig, threads);
		let promises = [];

		for (let i = 0; i < threads; i++) {
			promises.push(
				new Promise(function (resolve) {
					const worker = new Worker(sortWorkerUrl);
					worker.postMessage([data[i], ori[i]]);
					worker.onmessage = (ev) => {
						resolve(ev.data);
						worker.terminate();
					};
				})
			);
		}
		return promises;
	}
	/*
	function run_single_arr_worker(array, threads, type) {
		const data = splitWork(array, threads);
		const workUrl = type == 'filter' ? filterWorkerUrl : clampWorkerUrl;
		const dataToSend = type == 'filter' ? [data, filter] : [data];
		let promises = [];
		for (let i = 0; i < threads; i++) {
			promises.push(
				new Promise(function (resolve) {
					const worker = new Worker(workUrl);
					worker.postMessage(dataToSend);
					worker.onmessage = (ev) => {
						resolve(ev.data);
						worker.terminate();
					};
				})
			);
		}
		return promises;
	}

	function splitWork(array, n) {
		let chunks = [];
		for (let i = n; i > 0; i--) {
			chunks.push(array.splice(0, Math.ceil(array.length / i)));
		}
		return chunks;
	}
*/
	function splitWork_sorting(array, orig, n) {
		let chunks = [];
		let origChunks = [];
		for (let i = n; i > 0; i--) {
			chunks.push(array.splice(0, Math.ceil(array.length / i)));
			origChunks.push(orig.splice(0, Math.ceil(orig.length / i)));
		}
		return [chunks, origChunks];
	}
	function refilter() {
		console.log(filter);
		filterMatEn = false;
		setupOutput();
	}
</script>

<div class="input" bind:this={input_div}>
	<select
		on:change={(ev) => {
			value = ev.target.value;
			console.log(value);
			setupOutput();
		}}
		id="type"
	>
		<!--<option value="filter" selected>filter</option>-->
		<option value="contrast">contrast</option>
		<option value="pixel_sorter">Pixel Sorter</option>
		<option value="pixel_sorter_vert">Pixel Sorter Vertical</option>
	</select>
	{#if value == 'filter' && filterMatEn}
		<FilterMatrix bind:matrix={filter} />
		<button on:click={refilter}>Apply</button>
	{/if}
	{#if value == 'contrast'}
		<div class="sliders">
			<label>
				Threshhold : <input
					type="range"
					on:change={() => {
						setupOutput();
					}}
					bind:value={contThres}
					max="255"
					min="0"
				/>{contThres}
			</label>
		</div>
	{/if}
	{#if (value == 'pixel_sorter' || value == 'pixel_sorter_vert') && active}
		<div class="sliders">
			<label>
				max
				<input
					type="range"
					on:change={() => {
						setupOutput();
					}}
					bind:value={sortMaxThresh}
					bind
					max="255"
					min="0"
				/>{sortMaxThresh}
			</label>
			<p />
			<label>
				min
				<input
					type="range"
					bind:this={minThreshControl}
					on:change={() => {
						setupOutput();
					}}
					bind:value={sortMinThresh}
					bind
					max="255"
					min="0"
				/>{sortMinThresh}
			</label>
		</div>
	{/if}
	<canvas bind:this={canvas} willReadFrequently="true" />
	<canvas bind:this={outCanv} willReadFrequently="true" />

	<!-- svelte-ignore a11y-missing-attribute -->
	<img
		bind:this={image}
		src={input_url}
		on:load={() => {
			setupCanvas();
			setupOutput();
		}}
	/>
</div>

<style>
	.sliders {
		text-align: center;
		vertical-align: middle;
	}
	.input {
		display: flex;
		flex-direction: column;
		flex-wrap: wrap;
		text-align: center;
		align-items: center;
		justify-content: center;
	}
	img {
		visibility: hidden;
		position: absolute;
		top: 0;
		left: 0;
	}
	canvas {
		max-width: 100%;
		max-height: 100%;
		margin: auto;
		padding: 5px 0;
	}
</style>
