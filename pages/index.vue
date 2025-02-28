<script lang="ts" setup>
import { toast } from "vue-sonner";
import { Toaster } from "@/components/ui/sonner";
const input = ref("");
const output = ref("");
import { MoreVertical, Copy, Plus, List } from "lucide-vue-next";
import * as punycode from 'punycode';

// Создаем ссылку на элемент ввода для автофокуса
const inputRef = ref(null);

interface MxRecord {
  exchange: string;
  priority: number;
}
interface History {
  domain: string;
  aRecords?: string | undefined;
  mxRecords?: MxRecord[] | undefined;
  txtRecords?: string[] | undefined;
  isLoading?: boolean | undefined;
  isOpen?: boolean | undefined;
}
const history = useLocalStorage<History[]>("dns-history", []);

const filteredHistory = computed(() => {
  if (!input.value) return history.value;
  const searchTerm = input.value.toLowerCase();
  return history.value.filter(item => 
    item.domain.toLowerCase().includes(searchTerm)
  );
});

function extractDomain(input: string): string {
  // Удаляем начальные и конечные пробелы
  let url = input.trim();

  // Если URL не начинается с протокола, добавляем временный протокол
  if (!/^https?:\/\//i.test(url)) {
    url = "http://" + url;
  }

  try {
    // Создаем объект URL
    const parsedUrl = new URL(url);

    // Извлекаем hostname (домен с поддоменом)
    let domain = parsedUrl.hostname;

    // Декодируем punycode если домен содержит xn--
    if (domain.includes('xn--')) {
      domain = punycode.toUnicode(domain);
    }

    // Удаляем 'www.' если оно присутствует
    domain = domain.replace(/^www\./, "");

    return domain;
  } catch (error) {
    // Если URL некорректный, возвращаем исходное значение без протокола и www
    const cleanInput = input.trim()
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./, '');
      
    // Проверяем, не является ли введенное значение punycode
    return cleanInput.includes('xn--') ? punycode.toUnicode(cleanInput) : cleanInput;
  }
}

const getDns = async (domain: string) => {
  if (!domain) return;
  const res = await $fetch("/api/dns", {
    method: "POST",
    body: {
      domain: domain,
    },
  });
  if (res.aRecords) {
    output.value = res.aRecords[0] || "";
    history.value.find((item) => item.domain === domain)!.aRecords =
      res.aRecords[0];
    history.value.find((item) => item.domain === domain)!.mxRecords =
      res.mxRecords;
    history.value.find((item) => item.domain === domain)!.txtRecords = [
      ...new Set(res.txtRecords),
    ];
    history.value.find((item) => item.domain === domain)!.isLoading = false;
  } else {
    history.value.find((item) => item.domain === domain)!.isLoading = false;
    history.value.find((item) => item.domain === domain)!.aRecords =
      "unavailable";
    output.value = "";
  }
};

const addHistory = async () => {
  if (!input.value) return;
  const domain = extractDomain(input.value);
  
  // Проверяем, есть ли точное совпадение
  const exactMatch = history.value.find(item => 
    item.domain.toLowerCase() === domain.toLowerCase()
  );
  
  if (exactMatch) {
    // Если есть точное совпадение, обновляем его
    exactMatch.isLoading = true;
    history.value = [
      exactMatch,
      ...history.value.filter(item => item.domain !== exactMatch.domain),
    ];
    await getDns(domain);
  } else {
    // Если нет точного совпадения, добавляем новый домен
    history.value.map(item => (item.isOpen = false));
    history.value.unshift({
      domain: domain,
      isLoading: true,
      isOpen: true,
    });
    await getDns(domain);
  }
  input.value = ""; // Очищаем поле ввода после добавления
};

function deleteHistory(item: History) {
  history.value = history.value.filter((i) => i.domain !== item.domain);
}

const { copy, copied } = useClipboard();

// Объект для отслеживания состояния копирования для каждого элемента
const copyStates = reactive<Record<string, boolean>>({});
const copyARecord = (domain: string, aRecord: string | undefined) => {
  if (aRecord) {
    copy(aRecord);
    toast.success(`Copied A Record: ${aRecord}`, {});

    setTimeout(() => {
      copyStates[domain] = false;
    }, 2000); // Сбрасываем состояние через 2 секунды
  }
};

const refreshDns = async (domain: string) => {
  history.value.find((item) => item.domain === domain)!.isLoading = true;
  await getDns(domain);
};

// Исправляем хук onMounted для установки фокуса при загрузке страницы
onMounted(() => {
  // Используем nextTick для гарантии, что DOM полностью загружен
  nextTick(() => {
    // Находим input внутри компонента
    const inputElement = document.querySelector('input');
    if (inputElement) {
      inputElement.focus();
    }
  });
});
</script>

<template>
  <Toaster position="bottom-center" />
  <div class="max-w-3xl mx-auto py-10 px-10">
    <div class="mb-10 w-full flex justify-center">
      <Logo class="max-w-24 opacity-70 h-10 fill-slate-500" />
    </div>
    <div class="relative w-full items-center">
      <Input
        v-model="input"
        @keyup.enter="addHistory"
        class="px-8 shadow-sm"
        placeholder="Insert domain or URL"
      />
      <span
        class="absolute start-0 inset-y-0 flex items-center justify-center px-2"
      >
        <Plus class="size-5 text-input" />
      </span>
    </div>
    <div class="py-2 space-y-1">
      <Collapsible
        v-model:open="item.isOpen"
        v-for="item in filteredHistory"
        :key="item.domain"
        class="text-sm rounded-md shadow-sm hover:border-gray-300 hover:bg-gray-50 transition-all border border-gray-200 bg-gray-50"
      >
        <div class="flex justify-between items-center w-full">
          <CollapsibleTrigger class="w-full text-left">
            <p class="pl-2">{{ item.domain }}</p>
          </CollapsibleTrigger>
          <div class="flex items-center">
            <Button
              v-if="item.aRecords !== 'unavailable'"
              variant="ghost"
              class="gap-2 pr-0"
              @click="copyARecord(item.domain, item.aRecords)"
            >
              <p v-if="!item.isLoading">
                {{ item.aRecords }}
              </p>
              <p v-else class="">Loading...</p>
              <Copy class="size-4" />
            </Button>
            <p v-else class="text-red-400">{{ item.aRecords }}</p>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="icon">
                  <MoreVertical class="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="bottom">
                <DropdownMenuItem @click="refreshDns(item.domain)"
                  >Refresh</DropdownMenuItem
                >
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  class="text-red-500 hover:bg-red-500 hover:text-red-50"
                  @click="deleteHistory(item)"
                  >Delete</DropdownMenuItem
                >
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <CollapsibleContent>
          <div v-if="item.txtRecords?.length" class="mx-2 border-t py-2">
            <h3 class="mt-1">TXT</h3>
            <div
              v-for="txt in item.txtRecords"
              :key="txt"
              class="py-0.5 opacity-70"
            >
              <p class="text-sm">{{ txt }}</p>
            </div>
          </div>
          <div v-if="item.mxRecords" class="mx-2 border-t py-2">
            <h3 class="mt-1">MX Record</h3>
            <div
              v-for="mx in item.mxRecords"
              :key="mx.exchange"
              class="py-1 opacity-70"
            >
              <p class="text-sm">{{ mx.exchange }}</p>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  </div>
</template>
