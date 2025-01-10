<template>
  projectId: {{  props.projectId }} <br>
  fileId: {{  props.fileId }} <br>
  <div ref="editorContainer" style="height: 80vh; width: 40vw; border: 1px solid #ccc;"></div>
</template>

<script lang="ts" setup>
import { onMounted, ref, onBeforeUnmount, watch } from 'vue';
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
const ydoc = new Y.Doc();
const yText = ydoc.getText('monaco');

onMounted(() => {
  if (!editorContainer.value) {
    return;
  }
  editorInstance.value = monaco.editor.create(editorContainer.value, {
    value: '',
    language: 'javascript',
    theme: 'vs-dark',
  });

  if (!editorInstance.value) {
    return;
  }

  new MonacoBinding(yText, editorInstance.value.getModel(), new Set([editorInstance.value]), ydoc);

  props.socket.emit('joinProjectFile', props.projectId, props.fileId);

  props.socket.on('yjs-sync', (fileId: string, syncUpdate: Uint8Array) => {
    if (fileId === props.fileId) {
      Y.applyUpdate(ydoc, syncUpdate);
    }
  });

  props.socket.on('yjs-update', (fileId: string, update: Uint8Array) => {
    if (fileId === props.fileId) {
      Y.applyUpdate(ydoc, update);
    }
  });

  ydoc.on('update', (update: Uint8Array) => {
    props.socket.emit('yjs-update', props.fileId, update);
  });
});

onBeforeUnmount(() => {
  if (editorInstance.value) {
    editorInstance.value.dispose();
  }
  ydoc.destroy();
});
</script>