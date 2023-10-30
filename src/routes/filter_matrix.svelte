<script>
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	export let matrix;

</script>

<div class="matrix">
	{#each matrix as row, i}
		{#each matrix[i] as col, j}
			<input
				type="number"
				bind:value={matrix[i][j]}
				on:change={()=>{console.log(matrix);
                dispatch('reFilter')}}
				name="{i}-{j}"
				id="{i}-{j}"
				step="0.1"
				max="50"
				min="-50"
			/>
		{/each}
	{/each}
</div>

<style>
	.matrix {
		display: grid;
		grid-template-columns: 50px 50px 50px;
	}
	input[type='number']::-webkit-outer-spin-button,
	input[type='number']::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	input[type='number'] {
		margin: 3px;
		text-align: center;
	}
</style>
