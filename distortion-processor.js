class DistortionProcessor extends AudioWorkletProcessor {
    process(inputs, outputs, parameters) {
        const output = outputs[0];
        output.forEach((channel, j) => {
            for (let i = 0; i < channel.length; i ++) {
                const k = parameters['signalStrength'].length > 1?parameters['signalStrength'][i] : parameters['signalStrength'][0];
                const s = parameters['overallStrength'].length > 1?parameters['overallStrength'][i] : parameters['overallStrength'][0];
                channel[i] = k > 0 ? inputs[0][j][i] * k - (1-k)**2 * (Math.random() * 2 - 1) * inputs[0][j][i] * 0.5 * s : 0;
                // let x = i * 2 / channel.length - 1;
                // channel[i] = (3 + k) * x * (20 * Math.PI/180) / (Math.PI + k * Math.abs(x));
            }
            // console.log(channel);
        });
        return true;
    }

    static get parameterDescriptors () {
        return [{
          name: 'signalStrength',
          defaultValue: 1,
          minValue: 0,
          maxValue: 1,
          automationRate: 'a-rate'
        }, {
            name: 'overallStrength',
            defaultValue: 1,
            minValue: 0,
            maxValue: 1,
            automationRate: 'a-rate'
          }]
      }
}

registerProcessor('distortion-processor', DistortionProcessor);