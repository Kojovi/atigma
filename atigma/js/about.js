async function initAboutPage() {
  const settings = await loadAndApplyTheme();
  if (settings && settings.founderPhoto) {
    document.getElementById('founderPhoto').src = settings.founderPhoto;
    document.getElementById('founderPhoto').style.display = 'block';
    document.getElementById('founderPhotoPlaceholder').style.display = 'none';
  }
}

initAboutPage();
