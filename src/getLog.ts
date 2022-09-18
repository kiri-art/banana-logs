export default async function getLog(modelID: string, logID: string) {
  const response = await fetch(
    "https://backend-f3tq-qvcm.zeet-audiblogs.zeet.app/model/" +
      modelID +
      "/log/" +
      logID
  );
  const result = await response.json();
  return result.log;
}
