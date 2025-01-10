<template>
  projectId: {{  props.projectId }} <br>
  fileId: {{  props.fileId }} <br>
  <div ref="editorContainer" style="height: 80vh; width: 40vw; border: 1px solid #ccc;"></div>
</template>

<script lang="ts" setup>
import { onMounted, ref, onBeforeUnmount } from 'vue';
import { io, Socket } from 'socket.io-client';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import * as monaco from 'monaco-editor';

const props = defineProps<{
  projectId: string;
  fileId: string;
  socket: Socket;
}>();

const editorContainer = ref<HTMLElement | null>(null);
const editorInstance = ref<monaco.editor.IStandaloneCodeEditor | null>(null);
const editorValue = ref<string>();
onMounted(() => {
  if(!editorContainer.value) {
    return;
  }
  editorInstance.value = monaco.editor.create(editorContainer.value, {
    value: editorValue.value,
    language: 'javascript',
    theme: 'vs-dark',
  });
  if(!editorInstance.value) {
    return;
  }
  // Emit changes
  // editorInstance.value.onDidChangeModelContent(() => {
  //   emit('update:value', editorInstance.value?.getValue());
  // });
});

onBeforeUnmount(() => {
  if (editorInstance.value) {
    editorInstance.value.dispose();
  }
});

</script>