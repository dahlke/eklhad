import React, { Component } from 'react';
import './LinksList.scss';

class LinksList extends Component {

  render() {
    var links = this.props.links.map((link) => {
        return (
          <div id="linksList" key={link.id} className="link" >
              <span className="link-metadata">[<span className="link-date">{link.date}</span>] [<span className="link-type">{link.type}]</span></span>
              <span className="link-url"><a href={link.url}>{link.name}</a></span>
          </div>
        );
    });

    return (
      <div className="links-list">
        {links}
      </div>
    );
  }
}

export default LinksList;
