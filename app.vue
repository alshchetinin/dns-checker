<script lang="ts"></script>

<template>
  <DotPattern
    :size="12"
    :radius="1"
    :offset-x="0"
    :offset-y="0"
    class="absolute -z-10 inset-0 h-full w-full fill-black/10 [mask-image:radial-gradient(white,transparent_85%)]"
  >
  </DotPattern>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
