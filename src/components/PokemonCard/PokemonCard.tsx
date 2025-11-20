import "./PokemonCard.scss";

interface PokemonCardProps {
  name: string;
  url: string;
  image?: string;
}

const PokemonCard: React.FC<PokemonCardProps> = ({ name, url, image }) => {
  {
    return (
      <div className="card">
        <img
          className="card-img"
          src={image ?? ""}
          alt={name ?? "pokemon"}
        ></img>
        <div>
          <h3 className="card-name">{name}</h3>
          <p className="card-subtitle">Tap to view details</p>
        </div>
      </div>
    );
  }
};

export default PokemonCard;
