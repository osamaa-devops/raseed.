require("ts-node").register({
  transpileOnly: true,
  compilerOptions: {
    module: "NodeNext",
    moduleResolution: "NodeNext",
  },
});

(async () => {
  const { main } = require("./seed.ts");
  await main();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
