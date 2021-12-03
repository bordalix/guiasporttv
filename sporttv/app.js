'use strict';

const e = React.createElement;

function EventTitle(item) {
  return e('p', { key: `t_${item.id}` }, item.descricao);
}

function EventInfo(item) {
  const channel = e('span', { key: `c_${item.id}` }, item.canal.nome);
  const event = e('span', { key: `e_${item.id}` }, item.evento.nome);
  const modality = e('span', { key: `m_${item.id}` }, item.modalidade.nomeModalidade);
  return e('p', { key: `i_${item.id}` }, [channel, event, modality]);
}

function EventDate(item) {
  let startEpoch = new Date();
  let finishEpoch = new Date();
  startEpoch.setTime(item.data);
  finishEpoch.setTime(item.data + item.duracao);
  const day = e('span', { key: `y_${item.id}` }, startEpoch.toDateString());
  const start = e('span', { key: `s_${item.id}` }, startEpoch.toLocaleTimeString('pt-PT'));
  const finish = e('span', { key: `f_${item.id}` }, finishEpoch.toLocaleTimeString('pt-PT'));
  const emission = e('span', { key: `x_${item.id}` }, item.tipoEmissao);
  return e('p', { key: `d_${item.id}` }, [day, start, finish, emission]);
}

function EventDiv(item) {
  const title = EventTitle(item);
  const info = EventInfo(item);
  const date = EventDate(item);
  return e('div', { id: `x${item.id}`, key: item.id, className: item.tipoEmissao }, [title, info, date]);
}

function Select(id, items, value, onChange) {
  const options = [
    e('option', { key: `${id}_any`, value: '' }, `Qualquer ${id}`),
    ...items.map((item) => e('option', { key: `${id}_${item}`, value: item }, item)),
  ];
  return e('select', { id, key: id, onChange, value }, options);
}

function Navigation(props) {
  const channelSelect = Select('canal', props.channels, props.channelSelected, props.handleChange);
  const sportSelect = Select('desporto', props.sports, props.sportSelected, props.handleChange);
  const navContainer = e('div', { key: 'navContainer' }, [channelSelect, sportSelect]);
  return e('nav', { key: 'nav' }, navContainer);
}

function EventsList(props) {
  function filtered(items) {
    if (props.channelSelected)
      items = items.filter((i) => i.canal.nome === props.channelSelected);
    if (props.sportSelected)
      items = items.filter((i) => i.modalidade.nomeModalidade === props.sportSelected);
    return items;
  }
  const allEvents = filtered(props.items).map((item) => EventDiv(item));
  return e('div', { id: 'eventList', key: 'eventList' }, allEvents);
}

function MoreButton(props) {
  const button = e('button', { id: 'moreButton', onClick: props.handleChange }, 'Mais um dia');
  return e('p', { id: 'more', key: 'more' }, button)
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.state = {
      channels: [],
      channelSelected: null,
      day: 0,
      error: null,
      handleChange: this.handleChange,
      isLoaded: false,
      items: [],
      sports: [],
      sportSelected: null,
    };
  }

  handleChange(e) {
    if (e.target.id === 'canal') {
      this.setState({ channelSelected: e.target.value });
    }
    if (e.target.id === 'desporto') {
      this.setState({ sportSelected: e.target.value });
    }
    if (e.target.id === 'moreButton') {
      const day = this.state.day + 1;
      this.setState({ day });
      this.fetchEvents(day);
    }
  }

  fetchEvents(day = this.state.day) {
    fetch(this.apiURL(day))
      .then((res) => res.json())
      .then(
        (result) => {
          const items = this.state.items.concat(result);
          this.setState({
            isLoaded: true,
            items,
            sports: [...new Set(result.map((r) => r.modalidade.nomeModalidade))].sort(),
            channels: [...new Set(result.map((r) => r.canal.nome))].sort(),
          });
          if (day == 0) this.scrollToPresentTime();
        },
        // Note: it's important to handle errors here
        // instead of a catch() block so that we don't swallow
        // exceptions from actual bugs in components.
        (error) => {
          this.setState({
            isLoaded: true,
            error,
          });
        }
      );
  }

  apiURL(day) {
    // calculate and return api url
    const now = new Date();
    now.setDate(now.getDate() + day);
    const d = now.getDate();
    const m = now.getMonth() + 1;
    const y = now.getFullYear();
    const initDate = '?dataInicio=' + d + '%2F' + m + '%2F' + y + '+00:00';
    const endDate = '&dataFim=' + d + '%2F' + m + '%2F' + y + '+23:59';
    const proxy = 'https://corseverywhere.bordalix.workers.dev/?';
    const uri = 'https://www.sporttv.pt/api/channels/epg';
    const channels = '&idCanal=7133,727,728,729,5406,5422,7386';
    const limit = '&numeroRegistos=600';
    return proxy + uri + initDate + endDate + channels + limit;
  }

  scrollToPresentTime() {
    const now = new Date().getTime();
    const elm = this.state.items.find(i => i.data > now);
    console.log(now, elm);
    document.querySelector(`#x${elm.id}`).scrollIntoView();
  }

  componentDidMount() {
    this.fetchEvents();
  }
  render() {
    if (this.state.isLoaded) {
      if (this.state.error) return 'Something went wrong';
      return [e(Navigation, this.state), e(EventsList, this.state), e(MoreButton, this.state)];
    }
    return 'Loading...';
  }
}

ReactDOM.render(e(App), document.querySelector('#root'));
