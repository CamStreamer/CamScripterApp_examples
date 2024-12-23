export function pad(num: number, size: number) {
  const sign = Math.sign(num) === -1 ? "-" : "";
  return (
    sign +
    new Array(size)
      .concat([Math.abs(num)])
      .join("0")
      .slice(-size)
  );
}
