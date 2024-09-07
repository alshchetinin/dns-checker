import dns from "dns";
import util from "util";

// Преобразование методов dns в промисы для удобства использования
const resolve4 = util.promisify(dns.resolve4);
const resolveMx = util.promisify(dns.resolveMx);
const resolveTxt = util.promisify(dns.resolveTxt);
const resolveNs = util.promisify(dns.resolveNs);

async function checkDomainRecords(domain: string) {
  const result: {
    aRecords?: string[];
    mxRecords?: dns.MxRecord[];
    txtRecords?: string[];
    nsRecords?: string[];
  } = {};

  try {
    // A записи (IPv4 адреса)
    const aRecords = await resolve4(domain);
    if (aRecords.length > 0) result.aRecords = aRecords;
  } catch (error) {
    // Игнорируем ошибку, если A записи отсутствуют
  }

  try {
    // MX записи (почтовые серверы)
    const mxRecords = await resolveMx(domain);
    if (mxRecords.length > 0) result.mxRecords = mxRecords;
  } catch (error) {
    // Игнорируем ошибку, если MX записи отсутствуют
  }

  try {
    // TXT записи
    const txtRecords = await resolveTxt(domain);
    if (txtRecords.length > 0) {
      // Преобразуем массив массивов в плоский массив строк
      result.txtRecords = txtRecords.flat();
    }
  } catch (error) {
    // Игнорируем ошибку, если TXT записи отсутствуют
  }

  try {
    // NS записи (серверы имен)
    const nsRecords = await resolveNs(domain);
    if (nsRecords.length > 0) result.nsRecords = nsRecords;
  } catch (error) {
    // Игнорируем ошибку, если NS записи отсутствуют
  }

  // Если нет никаких записей, возвращаем пустой объект
  return Object.keys(result).length > 0 ? result : {};
}

export default defineEventHandler(async (event) => {
  const { domain } = await readBody(event);
  const data = await checkDomainRecords(domain);
  return data;
});
