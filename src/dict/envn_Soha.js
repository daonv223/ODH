/* global api */
class envn_Soha {
    constructor(options) {
        this.options = options;
        this.maxexample = 2;
        this.word = '';
    }

    async displayName() {
        return 'Soha English Dictionary';
    }


    setOptions(options) {
        this.options = options;
        this.maxexample = options.maxexample;
    }

    async findTerm(word) {
        this.word = word;
        let results = await Promise.all([this.findSoha(word)]);
        return [].concat(...results).filter(x => x);
    }

    async findSoha(word) {
        let notes = [];
        if (!word) return notes; // return empty notes

        function T(node) {
            if (!node)
                return '';
            else
                return node.innerText.trim();
        }

        let base = 'http://tratu.soha.vn/dict/en_vn/';
        let url = base + encodeURIComponent(word) + '#redirect';
        let doc = '';
        try {
            let data = await api.fetch(url);
            let parser = new DOMParser();
            doc = parser.parseFromString(data, 'text/html');
        } catch (err) {
            return [];
        }

        let dictionary = doc.querySelector('#show-alter');
        if (!dictionary) return notes; // return empty notes

        let expression = T(doc.querySelector('#firstHeading'));
        let reading = T(doc.querySelector('#bodyContent>#content-5 .mw-headline'));

        // let band = dictionary.querySelector('.word-frequency-img');
        // let bandnum = band ? band.dataset.band : '';
        // let extrainfo = bandnum ? `<span class="band">${'\u25CF'.repeat(Number(bandnum))}</span>` : '';
        let extrainfo = '';

        // let sound = dictionary.querySelector('a.hwd_sound');
        // let audios = sound ? [sound.dataset.srcMp3] : [];
        let audios = [];
        // make definition segement
        let definitions = [];
        let defblocks = dictionary.querySelectorAll('#content-5') || [];
        for (const defblock of defblocks) {
            let pos = T(defblock.parentElement.firstChild);
            pos = pos ? `<span class="pos">${pos}</span>` : '';
            let eng_tran = T(defblock.firstChild);
            if (!eng_tran) continue;
            let definition = '';
            let tran = `<span class='tran'>${eng_tran}</span>`;
            definition += `${pos}${tran}`;

            // make exmaple segement
            let examps = defblock.querySelectorAll('dl>dd>dl>dd') || '';
            if (examps.length > 0 && this.maxexample > 0) {
                definition += '<ul class="sents">';
                for (const [index, examp] of examps.entries()) {
                    if (index > this.maxexample - 1) break; // to control only 2 example sentence.
                    let eng_examp = T(examp) ? T(examp).replace(RegExp(expression, 'gi'), '<b>$&</b>') : '';
                    definition += eng_examp ? `<li class='sent'><span class='eng_sent'>${eng_examp}</span></li>` : '';
                }
                definition += '</ul>';
            }
            definition && definitions.push(definition);
        }
        let css = this.renderCSS();
        notes.push({
            css,
            expression,
            reading,
            extrainfo,
            definitions,
            audios,
        });
        return notes;
    }

    renderCSS() {
        let css = `
            <style>
                span.band {color:#e52920;}
                span.pos  {text-transform:lowercase; font-size:0.9em; margin-right:5px; padding:2px 4px; color:white; background-color:#0d47a1; border-radius:3px;}
                span.tran {margin:0; padding:0;}
                span.eng_tran {margin-right:3px; padding:0;}
                span.chn_tran {color:#0d47a1;}
                ul.sents {font-size:0.8em; list-style:square inside; margin:3px 0;padding:5px;background:rgba(13,71,161,0.1); border-radius:5px;}
                li.sent  {margin:0; padding:0;}
                span.eng_sent {margin-right:5px;}
                span.chn_sent {color:#0d47a1;}
            </style>`;
        return css;
    }
}