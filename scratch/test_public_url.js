const pastaUrl = "https://pjqafelkgwupljcqspnv.supabase.co/storage/v1/object/public/KSN%20super%20store/red%20pasta.jpg";
const hitUrl = "https://pjqafelkgwupljcqspnv.supabase.co/storage/v1/object/public/KSN%20super%20store/hit%20anti%20roach%20gel%2099rs%2015g.avif";

async function test(name, url) {
  try {
    const res = await fetch(url);
    console.log(`${name} Public URL Status:`, res.status);
    if (res.status === 200) {
      console.log(`-> ${name} is publicly accessible!`);
    } else {
      const text = await res.text();
      console.log(`-> Response:`, text);
    }
  } catch (err) {
    console.error(`-> Fetch failed for ${name}:`, err);
  }
}

async function run() {
  await test("Pasta", pastaUrl);
  await test("HIT Anti Roach Gel", hitUrl);
}

run();
