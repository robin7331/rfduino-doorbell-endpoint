

const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://192.168.188.26');
const noble = require('noble');

noble.on('stateChange', (state) => {
  if (state == 'poweredOn') {
    noble.startScanning([], true);
  }
});

noble.on('scanStart', () => {
  console.log('Scanning...')
});

noble.on('discover', (peripheral) => {

  // Address of our RFDuino
  if (peripheral.advertisement.localName == 'Doorbell') {
    console.log('Found the RFDuino!');

    noble.stopScanning();

    peripheral.once('disconnect', () => {
      setTimeout(function() {
          noble.startScanning([], true);
      }, 1000);
    });

    peripheral.connect(() => {

      peripheral.discoverServices(['2220'], (error, services) => {
        console.log("Found the Service");
        const service = services[0];

        service.discoverCharacteristics(['2221']);
        service.once('characteristicsDiscover', (characteristics) => {
          const characteristic = characteristics[0];

          console.log('Found the Characteristic');
          console.log('Waiting for a Door Bell Button Press...');

          characteristic.on('data', (data, isNotification) => {
            client.publish('/office/door/bell', 'pressed');
            console.log('Someone is at the door! Message published.');
          });
          characteristic.subscribe();
        });

      });
    });
  }
});
