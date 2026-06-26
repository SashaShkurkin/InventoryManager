using InventoryManager.Core.DTOs;
using InventoryManager.Core.Models;

namespace InventoryManager.Core.Interfaces;

public interface IScoutRepository
{
    Task<IEnumerable<Scout>> GetAllAsync();
    Task<Scout?> GetByIdAsync(int id);
    Task<Scout?> GetByEmailAsync(string email);
    Task<Scout> CreateAsync(Scout scout);
    Task<Scout?> UpdateAsync(int id, Scout scout);
    Task<ScoutDashboardDto> GetDashboardAsync(Scout scout);
}
