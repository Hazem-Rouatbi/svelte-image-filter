<script >

	//to be removed
	import './global.css';
	import ImageFilter from './image_filter.svelte';
	let input_div;
	let input_image;
    let input_imgs;
	let url_img;
	let input_label = 'Drag and drop a file or  Choose a file ...';
	let ready=false;
</script>
<div class="big-cont">
	<label
		class="file-input"
        on:dragover={(ev) => { ev.preventDefault() }}
        on:drop={(e) => {
			e.preventDefault();
			ready=false;
			input_image = e.dataTransfer.files[0];
            url_img = URL.createObjectURL(input_image);
			console.log(input_image);
			ready=true;
		}}
		>{input_label}
		<input
            bind:this={input_div}
			bind:files={input_imgs}
			on:change={() => {
				ready=false;
				input_image = input_imgs[0];
				input_label = input_image.name;
                url_img = URL.createObjectURL(input_image);
				console.log(input_image);
				ready=true;
				//input_label.textContent = input_img.value.replace("C:\\fakepath\\",'');
			}}
			type="file"
			name="Image"
			id="image"
			accept="image/jpeg,image/png,image/jpg"
		/>
	</label>
	{#if url_img}
    <div class="input">
        <ImageFilter  bind:input_url={url_img} />
    </div>


	{/if}
</div>
<style>
	.big-cont {
		display: flex;
		justify-content: center;
		align-items: center;
		flex-wrap: wrap;
		flex: content;
		padding: 10px;
		border-radius: 10px;
	}
	input[type='file'] {
		display: none;
	}
	.file-input {
        width: 80vw;
        height: 20vh;
        display: flex;
		justify-content: center;
		align-items: center;
		border: 2px dotted rgb(94, 94, 94);
		border-radius: 10px;
		padding: 2px 10px;
		user-select: none;
	}
    .input{
		position:relative;
        margin-top: 10px;
    }
</style>
