using MediTriage.Api.Models;

namespace MediTriage.Api.Services
{
    public interface ITokenService
    {
        (string token, DateTime expiresUtc) CreateToken(User user);
    }
}
