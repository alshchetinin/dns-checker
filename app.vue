<script lang="ts" setup>
const siteUrl = 'https://dns-checker.pages.dev'
const title = 'DNS Checker — A, MX, TXT lookup'
const description = 'Мгновенная проверка DNS-записей (A, MX, TXT) любого домена. Поддержка punycode, история запросов, поиск.'

useHead({
  title,
  meta: [
    { name: 'description', content: description },
    { property: 'og:title', content: 'DNS Checker' },
    { property: 'og:description', content: description },
    { property: 'og:image', content: `${siteUrl}/og-image.png` },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: siteUrl },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'DNS Checker' },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: `${siteUrl}/og-image.png` },
  ],
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
    { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
  ],
  htmlAttrs: { lang: 'ru' },
})
</script>

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
