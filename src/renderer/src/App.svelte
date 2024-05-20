<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import NestedElement from './components/NestedElement.svelte';

  let windows: { title: string; id: number }[] = []
  let selectedWindow: string = ""
  let elements: { title: string; type: string; children?: any[] }[] = []
  // let interactables: { title: string; region: { x: number, y: region}}[] = []
  let clear: NodeJS.Timeout

  onMount(async (): Promise<void> => {
    clear  = setInterval(async () => {
      windows = await window.electron.ipcRenderer.invoke('listWindows')
    }, 1000)
    windows = await window.electron.ipcRenderer.invoke('listWindows')
    selectedWindow = windows[0]?.title || ""

  })

  onDestroy(() => {
    clearInterval(clear)
  })

  const getWindow = async (): Promise<void> => {
    elements = await window.electron.ipcRenderer.invoke('getWindow', {
      title: selectedWindow
    })
  }

  const getInteractables = async (): Promise<void> => {
    const _i = await window.electron.ipcRenderer.invoke('getInteractables', {
      title: selectedWindow
    })
    console.log(_i)
  }
</script>

<div class="text">
  Nut JS AI
</div>
<p class="tip"> <code>F12</code> to open the devTool</p>
<div class="actions flex-column">
  <select bind:value={selectedWindow}>
    {#each windows as window}
      <option value={window.title}>{window.title}</option>
    {/each}
  </select>
  <div class="action">
    <button on:click={getWindow}>Retrieve selected window elements</button>
    <button on:click={getInteractables}>Retrieve interactable elements</button>
  </div>
  <div class="elements">
    {#each elements as element}
      <NestedElement {element} />
    {/each}
  </div>
</div>

<style>
  select {
    padding: 5px;
    margin-right: 10px;
    background-color: gray;
  }
  .elements {
    margin-top: 20px;
  }
</style>
