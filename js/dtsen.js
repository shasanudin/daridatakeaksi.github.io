fetch('data/dtsen.json')
  .then(response => response.json())
  .then(d => {
    document.getElementById('totalKK').textContent = d.total_kk;
    document.getElementById('desil12').textContent = d.desil["1_2"] + "%";
    document.getElementById('desil34').textContent = d.desil["3_4"] + "%";
    document.getElementById('desil510').textContent = d.desil["5_10"] + "%";
    document.getElementById('updateData').textContent = d.updated;
  })
  .catch(err => {
    console.error("Data DTSEN gagal dimuat", err);
  });
