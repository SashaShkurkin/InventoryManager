using AutoMapper;
using InventoryManager.Core.DTOs;
using InventoryManager.Core.Models;

namespace InventoryManager.API.Mapping;

public class InventoryProfile : Profile
{
    public InventoryProfile()
    {
        CreateMap<InventoryItem, InventoryItemDto>()
            .ForMember(d => d.State, o => o.MapFrom(s => s.State.ToString()));

        CreateMap<CreateInventoryItemDto, InventoryItem>()
            .ForMember(d => d.State, o => o.MapFrom(s => ParseState(s.State)));

        CreateMap<UpdateInventoryItemDto, InventoryItem>()
            .ForMember(d => d.State, o => o.MapFrom(s => ParseState(s.State)));
    }

    private static ItemState ParseState(string value) =>
        Enum.TryParse<ItemState>(value, true, out var st) ? st : ItemState.Processing;
}
