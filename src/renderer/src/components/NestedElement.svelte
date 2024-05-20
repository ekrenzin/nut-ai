<script lang="ts">
    export let element: { title: string; type: string; children?: any[] };
    console.log(element)
  </script>
  
  {#if element}
  <div class="element">
    <p>{element.title} ({element.type})</p>
    {#if element.children && element.children.length > 0}
      <div class="children">
        {#each element.children as child}
          <svelte:self element={child} />
        {/each}
      </div>
    {/if}
  </div>
  {/if}
  
  <style>
    .element {
      margin-left: 20px;
      border-left: 1px solid #ccc;
      padding-left: 10px;
    }
    .children {
      margin-top: 10px;
    }
  </style>
  