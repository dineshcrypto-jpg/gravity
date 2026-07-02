const url = "https://pjqafelkgwupljcqspnv.supabase.co/storage/v1/object/sign/KSN%20super%20store/revive%20liquid%20stiffener%20bottle%20136rs%20400g.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MzhmN2M5OS01MTU2LTRmNWYtYTk5OS1hNmRkNzVmODZlYTMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJLU04gc3VwZXIgc3RvcmUvcmV2aXZlIGxpcXVpZCBzdGlmZmVuZXIgYm90dGxlIDEzNnJzIDQwMGcuYXZpZiIsImlhdCI6MTc3OTk5NzAwNSwiZXhwIjoxODExNTMzMDA1fQ.PM-3EbQxZ7N30XPu5DnST7FAau-DIdwB8nUcGCRH9jk";

fetch(url)
  .then(res => {
    console.log("Status:", res.status);
    return res.text();
  })
  .then(text => {
    if (text.startsWith("{")) {
      console.log("Response Body:", JSON.parse(text));
    } else {
      console.log("Response Body (Length):", text.length);
    }
  })
  .catch(err => console.error(err));
